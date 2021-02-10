import React, {useState, useEffect} from 'react';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from '../simpletemplate/Title';

const title = "Report";

function preventDefault(event) {
  event.preventDefault();
}

const useStyles = makeStyles((theme) => ({
  seeMore: {
    marginTop: theme.spacing(3),
  },
}));

export default function FreeformTable() {
    
    const [report, setReport] = useState();

    function get_report() {
        fetch('api/create_report')
        .then(res => res.json())
        .then(data => {setReport(data);});
    };

    function format_row(row) {
        console.log(this);  // To use if needed
        return(
        <TableRow key={row[0]}>
        {row.slice(1).map((field) => (<TableCell>{field}</TableCell>))}
        </TableRow>
        )
    };

    useEffect(() => {
        get_report();
    }, []);
    
    console.log(report);
    const classes = useStyles();

    return (
        <React.Fragment>
        <Title>{title}</Title>
        <Table size="small">
            <TableHead>
            <TableRow>
                {report && report.columns.slice(1).map((column) => 
                (<TableCell>{column}</TableCell>))}
            </TableRow>
            </TableHead>
            <TableBody>
            {report && report.data.map(format_row, report.columns.slice(1))}
            </TableBody>
        </Table>
        </React.Fragment>
    );
}