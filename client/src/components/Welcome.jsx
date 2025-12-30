import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Welcome() {
  const [role, setRole] = useState("");

  useEffect(() => {
    // const fetchData = async () =>
    fetch("/api/role", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    })
      .then((res) => {
        if (!res.ok) {
          console.err(res.status, res.statusText);
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setRole(data.role);
      })
      .catch((err) => {
        navigate("/login");
      });
  }, []);

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <h1>Welcome {role.charAt(0).toUpperCase() + role.slice(1)}!</h1>
      </div>
    </div>
  );
}
