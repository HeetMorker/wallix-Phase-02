import { useEffect, useState } from "react";

export default function ConfigPage() {
  const [formData, setFormData] = useState({
    license: "",
    ldapURL: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/config/ldapURL", {
      method: "GET",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.ok) {
          console.log(res.message);
        }
        const newFormData = { ...formData, ldapURL: res.value };
        setFormData(newFormData);
      });
  }, []);

  function handleLicenseSubmit(event) {
    event.preventDefault();

    fetch("/api/license/activate", {
      method: "POST",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ license: formData.license }),
    })
      .then((res) => res.json())
      .then((res) => setMessage(<span>{res.message}</span>));
  }

  function handleLdapUrlSubmit(event) {
    event.preventDefault();

    fetch("/api/config", {
      method: "PUT",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property: "ldapURL", value: formData.ldapURL }),
    })
      .then((res) => res.json())
      .then((res) => setMessage(<span>{res.message}</span>));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <h3>Config</h3>
        <hr />
        <section>
          <h4>LDAP</h4>
          <form onSubmit={handleLdapUrlSubmit}>
            <div className="row mb-3">
              <label htmlFor="ldapURL" className="col-sm-2 col-form-label">
                URL
              </label>
              <div className="col-sm-10">
                <input
                  type="url"
                  className="form-control"
                  id="ldapURL"
                  name="ldapURL"
                  value={formData.ldapURL}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </form>
        </section>
        <hr />
        <section>
          <h4>License</h4>
          <form onSubmit={handleLicenseSubmit}>
            <div className="row mb-3">
              <label htmlFor="license" className="col-sm-2 col-form-label">
                License Key
              </label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  id="license"
                  name="license"
                  value={formData.license}
                  onChange={handleChange}
                />
              </div>
            </div>
            <button className="btn btn-primary">Activate</button>
          </form>
        </section>
        {message}
      </div>
    </div>
  );
}
