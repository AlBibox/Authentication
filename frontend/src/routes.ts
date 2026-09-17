import { createBrowserRouter, redirect } from "react-router";
import Home from "./components/Home"
import Page from "./components/Page";
import Login from "./components/Login";
import Register from "./components/Register"
import axios from "axios";
import api from "./api";


const apiUrl = import.meta.env.MODE === "production" ? import.meta.env.VITE_API_ENDPOINT : "http://localhost:3000"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Page,
    loader: async () => {
      //const response = await api.get('/');
      // return response.data; 
      try {
        const response = await api.post(`${apiUrl}/refresh`, {}, { withCredentials: true })
        if (response?.data?.accessToken) {
          const userData = await api.get(`${apiUrl}/me`, { headers: { 'Authorization': `Bearer ${response.data.accessToken}` }, withCredentials: true })
          return userData.data;
        }
      } catch (error) { }

    },
    children:
      [{
        index: true,
        Component: Home
      }, {
        path: "login",
        Component: Login,
        action: async ({ request }) => {
          let formData = await request.formData();
          let email = formData.get("email")
          let password = formData.get("password")
          let login = await axios.post(`${apiUrl}/login`, {
            email, password
          }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
          if (login.status === 401) {
            return login.data;
          }
          if (login.status === 200) {
            return redirect("/")
          }
        }
      }, {
        path: "register",
        Component: Register,
        action: async ({ request }) => {
          let formData = await request.formData();
          let email = formData.get("email")
          let password = formData.get("password")
          try {
            await axios.post(`${apiUrl}/register`, { email, password },
              { headers: { 'Content-Type': 'application/json' } })

            try {
              await axios.post(`${apiUrl}/login`, {
                email, password
              }, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
              // Login succeeded, send them to the home page.
              return redirect("/");

            } catch (err) {
              throw err
            }


          }

          catch (err) {
            throw err
          }

        }
      }

      ]

  },
]);