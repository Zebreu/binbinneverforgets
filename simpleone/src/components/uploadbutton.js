import React, {useState, useEffect} from 'react';
import { Box } from '@material-ui/core';
import { DropzoneArea } from 'material-ui-dropzone';

export default function UploadButton() {
    const [report, setReport] = useState();

    function uploadFile(loadedFiles) {
        const formData = new FormData();
        formData.append("file", loadedFiles[0])
        fetch('/upload_master_data', {
            method: "POST",  
            body: formData})
        .then(res => res.json())
        .then(data => {setReport(data);});
    };

    return (
        <div>
        <Box >
            <DropzoneArea 
            onChange = {uploadFile}
            />
        </Box>
        </div>

    );
}
