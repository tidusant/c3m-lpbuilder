import {  SafeRedirect } from "../components/data";
export default function Logout() {
  SafeRedirect("/login")
  return <p>Logging out...</p>;
}
