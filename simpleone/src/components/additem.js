import React, {useState, useEffect} from 'react';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button';

export default function AddItem() {

    const [opened, setOpened] = useState(false);
    const [date, setDate] = useState("2021-01-25");
    const [name, setName] = useState("");
    const [frequency, setFrequency] = useState("");

    function handleClose() {
        setOpened(false);
    }

    function handleOpen() {
        setOpened(true);
    }

    function handleResponse(data) {
        console.log(data);
        if (data.status == '401') {
            alert('Please login before using the tool');
            window.localStorage['username'] = 'No user';
        } else {
            window.location.reload(true);
        }
    }

    function uploadItem() {
        const formData = new FormData();
        console.log(date);
        formData.set("date", date);
        formData.set("name", name);
        formData.set("frequency", frequency);

        fetch('/add_item', {
            method: "POST",  
            body: formData,
            headers : new Headers({'Authorization': `Bearer ${window.localStorage['usertoken']}`})
        })
        .then(data => {handleResponse(data);});
        setOpened(false);
    };


    return (
        <div>
        <Button variant="contained" color="primary" onClick={handleOpen}>
        Add an item
        </Button>
       
        <Dialog
          title="Adding item"
          open={opened}
          >
          <form>
            <DialogContent>
            <DialogContentText>
                Please enter information for the new item. Allowed time is in number of weeks.
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                name="name"
                id="name"
                label="Item name"
                fullWidth
                size = "small"
                onChange = {(e) => setName(e.target.value)}
            />
            <TextField
                autoFocus
                name="date"
                margin="dense"
                id="date"
                label="Last checked date"
                defaultValue="2021-01-25"
                fullWidth
                size = "small"
                onChange = {(e) => setDate(e.target.value)}
            />
            <TextField
                autoFocus
                name="frequency"
                margin="dense"
                id="frequency"
                label="Allowed time between checks"
                fullWidth
                size = "small"
                onChange = {(e) => setFrequency(e.target.value)}
            />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={uploadItem} color="primary"> 
                    Add item
                </Button>
            </DialogActions>
          </form>
        </Dialog>

        </div>
    )
}