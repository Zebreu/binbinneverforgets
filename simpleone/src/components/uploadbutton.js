import React, {useState, useEffect} from 'react';
import { Button } from '@material-ui/core';
import { DropzoneDialog } from 'material-ui-dropzone';

export default function UploadButton() {

    const [open, setOpen] = useState(false);


    function uploadFile(files) {
        const formData = new FormData();
        formData.append("file", files[0])
        fetch('/upload_master_data', {
            method: "POST",  
            body: formData})
        .then(res => res.json())
        .then(data => {console.log(data);});
    };


    return (
        <div>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
            Add data file
        </Button>

        <DropzoneDialog
            cancelButtonText={"cancel"}
            submitButtonText={"submit"}
            maxFileSize={5000000}
            open={open}
            onClose={() => setOpen(false)}
            onSave={(files) => { uploadFile(files); setOpen(false);}}
        />
        </div>
    )
}