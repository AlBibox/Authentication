import { createBrowserRouter, redirect } from "react-router";
import Home from "./components/Home"
import Page from "./components/Page";
import Login from "./components/Login";
import Register from "./components/Register"
import {
  getSession,
  commitSession,
} from "./sessions.server";




export const router = createBrowserRouter([
  {
    path: "/",
    Component: Page,
    loader: async ({request}) => {
        const session = await getSession(
    request.headers.get("Cookie"),
  );

  console.log(session.has("userId"))

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    console.log("LOGGED IN")
  }
  console.log("NO")

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
          let login = await fetch("http://localhost:3000/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
          })
          if (login.status === 401) {
            return login.json();
          }
          if (login.status === 200) {
            return redirect("/")
          }
        }
      }, {
        path: "register",
        Component: Register,
        action: async ({ request }) => {
          const session = await getSession(
            request.headers.get("Cookie"),
          );
          let formData = await request.formData();
          let email = formData.get("email")
          let password = formData.get("password")
          let register = await fetch("http://localhost:3000/register", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { 'Content-Type': 'application/json' }
          })
          let response = await register.json()
          let userId = response.id
          
          if (!userId ) {
            session.flash("error", "Invalid username/password");

            // Redirect back to the login page with errors.
            redirect("/register", {
              headers: {
                "Set-Cookie": await commitSession(session),
              },
            });
            return response
          }

          session.set("userId", userId);

          // Login succeeded, send them to the home page.
          return redirect("/", {
            headers: {
              "Set-Cookie": await commitSession(session),
            },
          });



        }
      }

      ]

  },
]);