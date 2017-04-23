namespace Chat {
  export class ChatController {
    static $inject = ['$scope'];
    constructor(private $scope) {
      //this.developerLogin();
    }
    loggedIn: boolean;
    conn;
    status: string;
    commands;
    messages: any[] = [];
    message: string;
    username: string;
  
    filterList: string[] = [];

    login() {
      if(!this.username)
        return;
      this.connect();
      this.conn.addEventListener('open', () => {
        this.$scope.$apply(() => {
          this.loggedIn = true;
        });
      });
      this.conn.addEventListener('error', () => {
        this.startAutoConnect();
      });
    }
    developerLogin() {
      this.username = 'developer';
      this.login();
      this.loggedIn = true;
    }
    connect() {
      let wsPath = 'wss://chat.endfirst.com/ws';
      if (window.hasOwnProperty('WebSocket')) {
        let error = (response) => {
          this.loggedIn = false;
          this.error = response.reason || 'Connection closed.';
        };
        if(this.conn) //prevent multiple connections.
          this.conn.close();
        this.conn = new WebSocket(wsPath);
        this.conn.addEventListener('close', (response) => {
          error(response);
        });
        this.conn.addEventListener('error', (response) => {
          error(response);
        });
        this.conn.addEventListener('message', (response) => {
          let data = JSON.parse(response.data);
          if(this.filterList.indexOf(data.username) !== -1 || !data.hasOwnProperty('username'))
            return;
          this.$scope.$apply(() => {
            if (this.isCommand(data)) {
              this.runCommand(data);
            } else {
              this.messages.push(data);
            }
          });
        });
      } else {
        this.error = 'Your browser does not support WebSockets.';
      }
    }
    sendMessage() {
      if(this.loggedIn && this.message) {
        let command = this.toCommand(this.message),
            message = command || { //send command or message object
              "username": this.username,
              "text": this.message
            };
        this.conn.send(JSON.stringify(message));
      }
      this.message = '';
    }
    commands = {
      "clear": this.clear,
      "reset": this.reset,
      "kick": this.kick,
      "filter": this.filter
    };
    runCommand(command) {
      if(!this.isValidCommand(command))
        return;
      this[command.name](...command.arguments);
    }
    toCommand(item) {
      if(!this.isCommand(item))
        return false; //return if already command
      let [name, ...commandArguments] = item.slice(1).match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g).map((a) => a.replace(/"/g, ''));
      return {
        "username": this.username, //trace name
        "name": name,
        "arguments": commandArguments
      };
    };
    isCommand(item) {
      return typeof item === 'string' ? item.charAt(0) === '/' : false || typeof item === 'object' ? item.hasOwnProperty('name') && item.hasOwnProperty('arguments') : false;
    }
    isValidCommand(item) {
      return this.commands.hasOwnProperty(item.name);
    }
    private clear(filter = this.messages.length, filterLength = this.messages.length) { //default to all messages
      let messages = this.messages;
      if(!isNaN(filter)) {
        let messagesLength = this.messages.length;
        messages.splice(messagesLength - filter, messagesLength);
      } else {
        let deletedMessageNumber = 0,
            filterIndexes = [];

        messages.map((item, index) => {
          if(item.hasOwnProperty('username'))
            item.username === filter ? filterIndexes.push(index) : null;
        });
        
        filterIndexes.slice(0, filterLength); //make the array the filter length

        this.messages = messages.filter((item, index) => {
          if (deletedMessageNumber >= filterLength)
            return true;
          let filter = filterIndexes.indexOf(index) > 0;
          if(filter)
            deletedMessageNumber++;
          return !filter; //false removes item
        });
      }
    }
    startAutoConnect() {
      
    }
    private kick (target: string = '') {
      let users = target.split(', ');
      users.map((user) => {
        if(user === this.username || user === 'all') {
          this.loggedIn = false;
          this.conn.close();
        }
      });
    }
    private reset (target: string = 'all') {
      //this.commandData.userNumber = target === 'all' || target === 'users' ? 0 : this.commandData.userNumber;
      this.messages = target === 'all' || target === 'messages' ? [] : this.commandData.messages;
      this.kick(this.username);
    }
    private filter (target: string) {
      if(target === '')
        return;
      let users = target.split(', ');
      this.filterList.push(...users);
    }
  }

  export class TextareaSubmit {
    constructor() {  };
    restrict = 'A';
    scope = {
      textareaSubmit: '&'
    };
    link = (scope, element, attrs) => {
      element.on('keydown change', (event) => {
        if(event.code === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          scope.$apply(scope.textareaSubmit);
        }
      });
    };
    static factory() {
      let directive = () => new TextareaSubmit();
      directive.$inject = [];
      return directive;
    }
  }
}

angular
  .module('chat', ['monospaced.elastic', 'luegg.directives'])
  .controller('chatController', Chat.ChatController)
  .directive('textareaSubmit', Chat.TextareaSubmit.factory())