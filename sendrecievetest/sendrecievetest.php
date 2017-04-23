//php
//recieves data user id
if(isset($_POST['userID']))
{
    $uid = $_POST['userID']; //recieves

    echo json_encode($uid); //sends data back to javascript
}
