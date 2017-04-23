//javascript

//function uses javascript to pass data to file.php
function sayHelloWorld() {
    var hello = "hello";
    var world = "world";
    window.location.href = "somepage.php?w1=" + hello + "&w2=" + world;
    data: { userID : userID }
}

<!-- reads variable -->
$.get(
    "file.php",
    {paramOne : 1, paramX : 'abc'},
    function(data) {
       //recieve data here
    }
);