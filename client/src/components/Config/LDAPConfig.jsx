import React from "react";

const LDAPConfig = ({ formData, handleChange, handleSubmit }) => (
  <section>
    <h4>LDAP</h4>
    <form onSubmit={handleSubmit}>
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
);

export default LDAPConfig;
