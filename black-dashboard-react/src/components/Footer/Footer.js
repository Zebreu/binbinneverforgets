/*!

=========================================================
* Black Dashboard React v1.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
/*eslint-disable*/
import React, { useState, useEffect } from "react";

// reactstrap components
import { Container, Nav, NavItem, NavLink } from "reactstrap";



function Footer() {
  const [backnumber, setBacknumber] = useState(0);

  function get_my_data() {
    fetch('/just_a_number').then(res => res.json()).
        then(data => {setBacknumber(data);});
  };

  useEffect(() => {
    get_my_data();
  }, []);

  console.log(backnumber);
  return (
    <footer className="footer">
      <Container fluid>
        <Nav>
        <NavItem>
            <NavLink>
              <div onClick = {() => get_my_data()}>Number: {backnumber.number}</div> 
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink href="https://www.creative-tim.com/?ref=bdr-user-archive-footer">
              Creative Tim
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://www.creative-tim.com/presentation?ref=bdr-user-archive-footer">
              About Us
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://www.creative-tim.com/blog?ref=bdr-user-archive-footer">
              Blog
            </NavLink>
          </NavItem>
        </Nav>
        <div className="copyright">
          © {new Date().getFullYear()} made with{" "}
          <i className="tim-icons icon-heart-2" /> by{" "}
          <a
            href="https://www.creative-tim.com/?ref=bdr-user-archive-footer"
            target="_blank"
          >
            Creative Tim
          </a>{" "}
          for a better web.
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
