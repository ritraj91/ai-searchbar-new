
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import AISearchBar from "./components/AISearchBar";
import "./index.css";
import "./App.css";

const initialMembers = [
  { id: 1, name: "Rahul Sharma", email: "rahul@example.com", role: "Manager", status: "Active" },
  { id: 2, name: "Priya Singh", email: "priya@example.com", role: "Designer", status: "Active" },
  { id: 3, name: "Amit Kumar", email: "amit@example.com", role: "Developer", status: "Inactive" },
];

function Layout({ children }) {
  const currentRole = "manager";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Hourmaker</h2>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/team">Team Management</Link>
          <Link to="/team/invite">Invite Member</Link>
          <Link to="/settings">Account Settings</Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>Employee Management</h2>
            <p>Manage your workspace</p>
          </div>
          <AISearchBar role={currentRole} />
        </header>

        {children}
      </main>
    </div>
  );
}

function SectionButtons({ items, active, onSelect }) {
  return (
    <div className="section-buttons">
      {items.map((item) => (
        <button
          key={item.id}
          className={active === item.id ? "active" : ""}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Dashboard() {
  const [params, setParams] = useSearchParams();
  const section = params.get("section") || "overview";

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "statistics", label: "Statistics" },
    { id: "activity", label: "Recent Activity" },
    { id: "actions", label: "Quick Actions" },
  ];

  function selectSection(value) {
    setParams(value === "overview" ? {} : { section: value });
  }

  return (
    <Layout>
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>Welcome to your Hourmaker workspace.</p>
      </div>

      <SectionButtons
        items={sections}
        active={section}
        onSelect={selectSection}
      />

      {section === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Employees</h3>
              <h2>24</h2>
              <p>Registered team members</p>
            </div>
            <div className="stat-card">
              <h3>Active Members</h3>
              <h2>20</h2>
              <p>Currently active</p>
            </div>
            <div className="stat-card">
              <h3>Pending Invitations</h3>
              <h2>4</h2>
              <p>Awaiting response</p>
            </div>
          </div>

          <div className="content-card">
            <h2>Dashboard Overview</h2>
            <p>Choose a dashboard section above to explore more details.</p>
          </div>
        </>
      )}

      {section === "statistics" && (
        <div className="content-card">
          <h2>Dashboard Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card"><h3>Total Employees</h3><h2>24</h2></div>
            <div className="stat-card"><h3>Active</h3><h2>20</h2></div>
            <div className="stat-card"><h3>Inactive</h3><h2>4</h2></div>
          </div>
          <p>These are sample dashboard statistics.</p>
        </div>
      )}

      {section === "activity" && (
        <div className="content-card">
          <h2>Recent Team Activity</h2>
          <ul className="activity-list">
            <li>Rahul Sharma joined the team.</li>
            <li>Priya Singh updated her profile.</li>
            <li>A new invitation was created.</li>
          </ul>
        </div>
      )}

      {section === "actions" && (
        <div className="content-card">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link className="action-button" to="/team">View Team Members</Link>
            <Link className="action-button" to="/team/invite">Invite Member</Link>
            <Link className="action-button" to="/settings">Account Settings</Link>
          </div>
        </div>
      )}
    </Layout>
  );
}

function TeamPage({ members, setMembers }) {
  const [params, setParams] = useSearchParams();
  const section = params.get("section") || "list";
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(members[0]?.id || "");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const sections = [
    { id: "list", label: "Members List" },
    { id: "search", label: "Search Members" },
    { id: "edit", label: "Edit Member" },
    { id: "remove", label: "Remove Member" },
    { id: "status", label: "Member Status" },
  ];

  function selectSection(value) {
    setParams({ section: value });
  }

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedMember = members.find(
    (member) => member.id === Number(selectedId)
  );

  function startEdit(member) {
    setSelectedId(member.id);
    setEditName(member.name);
    setEditEmail(member.email);
    selectSection("edit");
  }

  function saveMember(event) {
    event.preventDefault();

    setMembers((previous) =>
      previous.map((member) =>
        member.id === Number(selectedId)
          ? { ...member, name: editName, email: editEmail }
          : member
      )
    );

    alert("Member details updated.");
    selectSection("list");
  }

  function removeMember(id) {
    const confirmed = window.confirm("Are you sure you want to remove this member?");
    if (!confirmed) return;

    setMembers((previous) => previous.filter((member) => member.id !== id));
    setSelectedId("");
  }

  function toggleStatus(id) {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === id
          ? {
              ...member,
              status: member.status === "Active" ? "Inactive" : "Active",
            }
          : member
      )
    );
  }

  return (
    <Layout>
      <div className="page-heading">
        <h1>Team Management</h1>
        <p>View, search and manage your team members.</p>
      </div>

      <SectionButtons items={sections} active={section} onSelect={selectSection} />

      {section === "list" && (
        <div className="content-card">
          <h2>Team Members List</h2>
          <MemberTable members={members} onEdit={startEdit} onRemove={removeMember} />
        </div>
      )}

      {section === "search" && (
        <div className="content-card">
          <h2>Search Team Members</h2>
          <input
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <MemberTable members={filteredMembers} onEdit={startEdit} onRemove={removeMember} />
        </div>
      )}

      {section === "edit" && (
        <div className="content-card">
          <h2>Edit Team Member</h2>

          <label>Select member</label>
          <select
            className="form-input"
            value={selectedId}
            onChange={(event) => {
              const member = members.find((m) => m.id === Number(event.target.value));
              setSelectedId(event.target.value);
              setEditName(member?.name || "");
              setEditEmail(member?.email || "");
            }}
          >
            <option value="">Select a member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          {selectedMember && (
            <form onSubmit={saveMember} className="form-stack">
              <label>Name</label>
              <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <label>Email</label>
              <input className="form-input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              <button className="primary-button">Save Changes</button>
            </form>
          )}
        </div>
      )}

      {section === "remove" && (
        <div className="content-card">
          <h2>Remove Team Member</h2>
          {members.map((member) => (
            <div className="member-action-row" key={member.id}>
              <span>{member.name} — {member.email}</span>
              <button className="danger-button" onClick={() => removeMember(member.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {section === "status" && (
        <div className="content-card">
          <h2>Manage Member Status</h2>
          {members.map((member) => (
            <div className="member-action-row" key={member.id}>
              <span>{member.name} — <strong>{member.status}</strong></span>
              <button className="secondary-button" onClick={() => toggleStatus(member.id)}>
                {member.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function MemberTable({ members, onEdit, onRemove }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td>{member.status}</td>
              <td className="table-actions">
                <button className="secondary-button" onClick={() => onEdit(member)}>Edit</button>
                <button className="danger-button" onClick={() => onRemove(member.id)}>Remove</button>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr><td colSpan="5">No team members found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InvitePage({ members, setMembers }) {
  const [params] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");
  const [message, setMessage] = useState("");

  const section = params.get("section") || "form";

  function resetForm() {
    setName("");
    setEmail("");
    setRole("Employee");
    setMessage("");
  }

  function sendInvitation(event) {
    event.preventDefault();

    setMembers((previous) => [
      ...previous,
      {
        id: Date.now(),
        name,
        email,
        role,
        status: "Pending",
      },
    ]);

    setMessage(`Invitation record created for ${email}.`);
    setName("");
    setEmail("");
  }

  return (
    <Layout>
      <div className="page-heading">
        <h1>Invite a Team Member</h1>
        <p>Add a new member to your workspace.</p>
      </div>

      <div className="content-card">
        <h2>{section === "reset" ? "Reset Invitation Form" : "New Member Invitation Form"}</h2>

        {section === "reset" && (
          <p>Fill in the form below to create a new invitation.</p>
        )}

        <form onSubmit={sendInvitation} className="form-stack">
          <label>Full Name</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Email Address</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Role</label>
          <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Employee</option>
            <option>Manager</option>
            <option>Designer</option>
            <option>Developer</option>
          </select>

          <div className="button-row">
            <button className="primary-button" type="submit">Create Invitation</button>
            <button className="secondary-button" type="button" onClick={resetForm}>Reset Form</button>
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
      </div>
    </Layout>
  );
}

function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get("section") || "profile";

  const [name, setName] = useState("Hourmaker User");
  const [email, setEmail] = useState("user@example.com");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("Light");

  const sections = [
    { id: "profile", label: "Edit Profile" },
    { id: "notifications", label: "Email Notifications" },
    { id: "theme", label: "Theme Settings" },
    { id: "logout", label: "Logout" },
  ];

  return (
    <Layout>
      <div className="page-heading">
        <h1>Account Settings</h1>
        <p>Manage your account preferences.</p>
      </div>

      <SectionButtons
        items={sections}
        active={section}
        onSelect={(value) => setParams({ section: value })}
      />

      <div className="content-card">
        {section === "profile" && (
          <>
            <h2>Edit Profile</h2>
            <form className="form-stack" onSubmit={(e) => { e.preventDefault(); alert("Profile saved."); }}>
              <label>Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
              <label>Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="primary-button">Save Profile Changes</button>
            </form>
          </>
        )}

        {section === "notifications" && (
          <>
            <h2>Email Notifications</h2>
            <label className="checkbox-row">
              <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
              Receive email notifications
            </label>
            <p>Notifications are currently {notifications ? "enabled" : "disabled"} in this demo.</p>
          </>
        )}

        {section === "theme" && (
          <>
            <h2>Theme Settings</h2>
            <select className="form-input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option>Light</option>
              <option>Dark</option>
              <option>System Default</option>
            </select>
            <p>Selected theme: {theme}</p>
          </>
        )}

        {section === "logout" && (
          <>
            <h2>Logout</h2>
            <p>This is a demo application. No real account session is connected.</p>
            <button className="danger-button" onClick={() => alert("Demo logout clicked.")}>Logout</button>
          </>
        )}
      </div>
    </Layout>
  );
}

function BillingPage() {
  return (
    <Layout>
      <div className="page-heading">
        <h1>Billing and Payments</h1>
        <p>Manage your subscription and payment details.</p>
      </div>
      <div className="content-card">
        <h2>Current Plan</h2>
        <p>Free Demo Plan</p>
        <p>No real payment information is connected.</p>
        <button className="primary-button" onClick={() => alert("Billing demo action.")}>
          Manage Plan
        </button>
      </div>
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout>
      <div className="content-card">
        <h2>Page not found</h2>
        <Link to="/dashboard">Go to Dashboard</Link>
      </div>
    </Layout>
  );
}

export default function App() {
  const [members, setMembers] = useState(initialMembers);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/team" element={<TeamPage members={members} setMembers={setMembers} />} />
        <Route path="/team/invite" element={<InvitePage members={members} setMembers={setMembers} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
