import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button';
import SelectInput from '@material-ui/core/Select/SelectInput';

export default function Login () {
    const [results, setResults] = useState({});
    const [opened, setOpened] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    function handleClose() {
        setOpened(false);
    }

    function handleOpen() {
        setOpened(true);
    }

    function storeToken(token) {
        window.localStorage['usertoken'] = token['token_created'];
        setUsername('');
        setPassword('');
        setOpened(false);
        window.location.reload(true);
    }

    function onRegister() {
        const formData = new FormData();
        formData.set("username", username);
        formData.set("password", password);
        
        fetch('/users/register', {
            method: "POST",  
            body: formData})
        .then(res => res.json())
        .then(data => {console.log(data);});
        
        setUsername('');
        setPassword('');
        setOpened(false);
    }

    function onLogin() {
        fetch('/users/login', {
            headers: new Headers({"Authorization": `Basic ${window.btoa(username + ':' + password)}`}),
            method: "GET"})
        .then(res => res.json())
        .then(data => {storeToken(data);});
        setUsername('');
        setPassword('');
        setOpened(false);
    }

    return (
        <div>
        <Button variant="outlined" color="primary" onClick={handleOpen}>
        Login
        </Button>
       
        <Dialog
          title="Login"
          open={opened}
          >
          <form>
            <DialogContent>
            <DialogContentText>
                Please enter your username and password to login. You will need to sign in after you first sign up.
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                name="username"
                id="username"
                label="Username"
                fullWidth
                onChange = {(e) => setUsername(e.target.value)}
            />
            <TextField
                autoFocus
                name="password"
                margin="dense"
                id="password"
                label="Password"
                type="password"
                fullWidth
                onChange = {(e) => setPassword(e.target.value)}
            />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={onRegister} color="primary"> 
                    Sign up
                </Button>
                <Button onClick={onLogin} color="primary"> 
                    Sign in
                </Button>
            </DialogActions>
          </form>
        </Dialog>

        </div>
    );
}