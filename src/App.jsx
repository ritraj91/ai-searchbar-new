import { CapabilityProvider } from "./context/CapabilityRegistry";
import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useSearchParams,
} from "react-router-dom";

import AISearchBar from "./components/AISearchBar";

import "./index.css";
import "./App.css";

// --------------------------------------------------
// INITIAL EMPLOYEE DATA
// --------------------------------------------------

const initialMembers = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@example.com",
    role: "Manager",
    status: "Active",
  },
  {
    id: 2,
    name: "Priya Singh",
    email: "priya@example.com",
    role: "Designer",
    status: "Active",
  },
  {
    id: 3,
    name: "Amit Kumar",
    email: "amit@example.com",
    role: "Developer",
    status: "Inactive",
  },
];

// --------------------------------------------------
// COMMON APPLICATION LAYOUT
// --------------------------------------------------

function Layout({ children }) {
  // Demo role. Replace with authenticated user role later.
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

// --------------------------------------------------
// REUSABLE SECTION BUTTONS
// --------------------------------------------------

function SectionButtons({ items, active, onSelect }) {
  return (
    <div className="section-buttons">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? "active" : ""}
          data-ai-action-id={`section-${item.id}`}
          data-ai-description={`Open the ${item.label} section and display its information.`}
          data-ai-category="navigation"
          data-ai-risk="low"
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// --------------------------------------------------
// DASHBOARD PAGE
// --------------------------------------------------

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
    setParams(
      value === "overview" ? {} : { section: value }
    );
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

      {/* OVERVIEW */}

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
            <p>
              Choose a dashboard section above to explore more details.
            </p>
             <button
    type="button"
    className="primary-button"
    title="Generate a dashboard report"
    onClick={() => {
      alert("Dashboard report generated successfully!");
    }}
  ></button>
          </div>
        </>
      )}

      {/* STATISTICS */}

      {section === "statistics" && (
        <div className="content-card">
          <h2>Dashboard Statistics</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Employees</h3>
              <h2>24</h2>
            </div>

            <div className="stat-card">
              <h3>Active</h3>
              <h2>20</h2>
            </div>

            <div className="stat-card">
              <h3>Inactive</h3>
              <h2>4</h2>
            </div>
          </div>

          <p>These are sample dashboard statistics.</p>
        </div>
      )}

      {/* RECENT ACTIVITY */}

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

      {/* QUICK ACTIONS */}

      {section === "actions" && (
        <div className="content-card">
          <h2>Quick Actions</h2>

          <div className="action-grid">
            <Link className="action-button" to="/team">
              View Team Members
            </Link>

            <Link className="action-button" to="/team/invite">
              Invite Member
            </Link>

            <Link className="action-button" to="/settings">
              Account Settings
            </Link>
          </div>
        </div>
      )}

      {/* INVALID SECTION */}

      {!sections.some((item) => item.id === section) && (
        <div className="content-card">
          <h2>Dashboard section not found</h2>

          <button
            type="button"
            className="primary-button"
            data-ai-action-id="dashboard-back-to-overview"
            data-ai-description="Return to the dashboard overview section."
            data-ai-category="navigation"
            data-ai-risk="low"
            onClick={() => selectSection("overview")}
          >
            Back to Overview
          </button>
        </div>
      )}
    </Layout>
  );
}

// --------------------------------------------------
// TEAM MANAGEMENT PAGE
// --------------------------------------------------

function TeamPage({ members, setMembers }) {
  const [params, setParams] = useSearchParams();

  const section = params.get("section") || "list";

  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState(
    members[0]?.id || ""
  );

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

  // Open employee edit form

  function startEdit(member) {
    setSelectedId(member.id);
    setEditName(member.name);
    setEditEmail(member.email);

    selectSection("edit");
  }

  // Save employee details

  function saveMember(event) {
    event.preventDefault();

    if (!selectedMember) {
      alert("Please select a valid team member.");
      return;
    }

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      alert("Name and email are required.");
      return;
    }

    const emailExists = members.some(
      (member) =>
        member.id !== Number(selectedId) &&
        member.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (emailExists) {
      alert("This email already exists in your team.");
      return;
    }

    setMembers((previous) =>
      previous.map((member) =>
        member.id === Number(selectedId)
          ? {
              ...member,
              name: trimmedName,
              email: trimmedEmail,
            }
          : member
      )
    );

    alert("Member details updated.");

    selectSection("list");
  }

  // Remove employee

  function removeMember(id) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );

    if (!confirmed) return;

    setMembers((previous) =>
      previous.filter((member) => member.id !== id)
    );

    if (Number(selectedId) === id) {
      setSelectedId("");
      setEditName("");
      setEditEmail("");
    }
  }

  // Activate / Deactivate employee

  function toggleStatus(id) {
    setMembers((previous) =>
      previous.map((member) =>
        member.id === id
          ? {
              ...member,
              status:
                member.status === "Active"
                  ? "Inactive"
                  : "Active",
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

      <SectionButtons
        items={sections}
        active={section}
        onSelect={selectSection}
      />

      {/* MEMBERS LIST */}

      {section === "list" && (
        <div className="content-card">
          <h2>Team Members List</h2>

          <MemberTable
            members={members}
            actionScope="team-list"
            onEdit={startEdit}
            onRemove={removeMember}
          />
        </div>
      )}

      {/* SEARCH MEMBERS */}

      {section === "search" && (
        <div className="content-card">
          <h2>Search Team Members</h2>

          <input
            className="form-input"
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <MemberTable
            members={filteredMembers}
            actionScope="team-search"
            onEdit={startEdit}
            onRemove={removeMember}
          />
        </div>
      )}

      {/* EDIT MEMBER */}

      {section === "edit" && (
        <div className="content-card">
          <h2>Edit Team Member</h2>

          <label>Select member</label>

          <select
            className="form-input"
            value={selectedId}
            onChange={(event) => {
              const member = members.find(
                (item) =>
                  item.id === Number(event.target.value)
              );

              setSelectedId(event.target.value);
              setEditName(member?.name || "");
              setEditEmail(member?.email || "");
            }}
          >
            <option value="">Select a member</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          {selectedMember && (
            <form
              onSubmit={saveMember}
              className="form-stack"
            >
              <label>Name</label>

              <input
                className="form-input"
                value={editName}
                onChange={(event) =>
                  setEditName(event.target.value)
                }
                required
              />

              <label>Email</label>

              <input
                className="form-input"
                type="email"
                value={editEmail}
                onChange={(event) =>
                  setEditEmail(event.target.value)
                }
                required
              />

              <button
                type="submit"
                className="primary-button"
                data-ai-action-id="save-member-changes"
                data-ai-description={`Save updated name and email details for ${selectedMember.name}.`}
                data-ai-category="employee-management"
                data-ai-risk="confirm"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>
      )}

      {/* REMOVE MEMBER */}

      {section === "remove" && (
        <div className="content-card">
          <h2>Remove Team Member</h2>

          {members.length === 0 && (
            <p>No team members found.</p>
          )}

          {members.map((member) => (
            <div className="member-action-row" key={member.id}>
              <span>
                {member.name} — {member.email}
              </span>

              <button
                type="button"
                className="danger-button"
                data-ai-action-id={`remove-member-section-${member.id}`}
                data-ai-description={`Remove ${member.name} from the team.`}
                data-ai-category="employee-management"
                data-ai-risk="high"
                onClick={() => removeMember(member.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MEMBER STATUS */}

      {section === "status" && (
        <div className="content-card">
          <h2>Manage Member Status</h2>

          {members.length === 0 && (
            <p>No team members found.</p>
          )}

          {members.map((member) => (
            <div className="member-action-row" key={member.id}>
              <span>
                {member.name} — <strong>{member.status}</strong>
              </span>

              <button
                type="button"
                className="secondary-button"
                data-ai-action-id={`toggle-member-status-${member.id}`}
                data-ai-description={`Change ${member.name}'s status from ${member.status} to ${
                  member.status === "Active" ? "Inactive" : "Active"
                }.`}
                data-ai-category="employee-management"
                data-ai-risk={
                  member.status === "Active" ? "high" : "confirm"
                }
                onClick={() => toggleStatus(member.id)}
              >
                {member.status === "Active"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INVALID SECTION */}

      {!sections.some((item) => item.id === section) && (
        <div className="content-card">
          <h2>Team section not found</h2>

          <button
            type="button"
            className="primary-button"
            data-ai-action-id="team-back-to-list"
            data-ai-description="Return to the team members list."
            data-ai-category="navigation"
            data-ai-risk="low"
            onClick={() => selectSection("list")}
          >
            View Members List
          </button>
        </div>
      )}
    </Layout>
  );
}

// --------------------------------------------------
// REUSABLE EMPLOYEE TABLE
// --------------------------------------------------

function MemberTable({
  members,
  actionScope,
  onEdit,
  onRemove,
}) {
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
                <button
                  type="button"
                  className="secondary-button"
                  data-ai-action-id={`edit-member-${actionScope}-${member.id}`}
                  data-ai-description={`Open the edit form for ${member.name} to update employee details.`}
                  data-ai-category="employee-management"
                  data-ai-risk="confirm"
                  onClick={() => onEdit(member)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="danger-button"
                  data-ai-action-id={`remove-member-${actionScope}-${member.id}`}
                  data-ai-description={`Remove ${member.name} from the team.`}
                  data-ai-category="employee-management"
                  data-ai-risk="high"
                  onClick={() => onRemove(member.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}

          {members.length === 0 && (
            <tr>
              <td colSpan="5">
                No team members found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// --------------------------------------------------
// INVITE MEMBER PAGE
// --------------------------------------------------

function InvitePage({ members, setMembers }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");
  const [message, setMessage] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setRole("Employee");
    setMessage("");
  }

  function sendInvitation(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setMessage("Please enter name and email.");
      return;
    }

    const emailExists = members.some(
      (member) =>
        member.email.toLowerCase() === trimmedEmail.toLowerCase()
    );

    if (emailExists) {
      setMessage("This email already exists in your team.");
      return;
    }

    setMembers((previous) => [
      ...previous,
      {
        id: Date.now(),
        name: trimmedName,
        email: trimmedEmail,
        role,
        status: "Pending",
      },
    ]);

    setMessage(
      `Invitation record created for ${trimmedEmail}.`
    );

    setName("");
    setEmail("");
    setRole("Employee");
  }

  return (
    <Layout>
      <div className="page-heading">
        <h1>Invite a Team Member</h1>
        <p>Add a new member to your workspace.</p>
      </div>

      <div className="content-card">
        <h2>New Member Invitation Form</h2>

        <form
          onSubmit={sendInvitation}
          className="form-stack"
        >
          <label>Full Name</label>

          <input
            className="form-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label>Email Address</label>

          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Role</label>

          <select
            className="form-input"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option>Employee</option>
            <option>Manager</option>
            <option>Designer</option>
            <option>Developer</option>
          </select>

          <div className="button-row">
            <button
              className="primary-button"
              type="submit"
              data-ai-action-id="create-invitation"
              data-ai-description="Create a team invitation using the entered employee name, email address and role."
              data-ai-category="invitations"
              data-ai-risk="confirm"
            >
              Create Invitation
            </button>

            <button
              className="secondary-button"
              type="button"
              data-ai-action-id="reset-invitation-form"
              data-ai-description="Clear all entered fields in the invitation form."
              data-ai-category="invitations"
              data-ai-risk="confirm"
              onClick={resetForm}
            >
              Reset Form
            </button>
          </div>
        </form>

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}
      </div>
    </Layout>
  );
}

// --------------------------------------------------
// ACCOUNT SETTINGS PAGE
// --------------------------------------------------

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

        {/* EDIT PROFILE */}

        {section === "profile" && (
          <>
            <h2>Edit Profile</h2>

            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                alert("Profile saved.");
              }}
            >
              <label>Name</label>

              <input
                className="form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <label>Email</label>

              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <button
                className="primary-button"
                type="submit"
                data-ai-action-id="save-profile-changes"
                data-ai-description="Save the updated account profile name and email."
                data-ai-category="account-settings"
                data-ai-risk="confirm"
              >
                Save Profile Changes
              </button>
            </form>
          </>
        )}

        {/* EMAIL NOTIFICATIONS */}

        {section === "notifications" && (
          <>
            <h2>Email Notifications</h2>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(event) =>
                  setNotifications(event.target.checked)
                }
              />

              Receive email notifications
            </label>

            <p>
              Notifications are currently{" "}
              {notifications ? "enabled" : "disabled"} in this demo.
            </p>
          </>
        )}

        {/* THEME SETTINGS */}

        {section === "theme" && (
          <>
            <h2>Theme Settings</h2>

            <select
              className="form-input"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
            >
              <option>Light</option>
              <option>Dark</option>
              <option>System Default</option>
            </select>

            <p>Selected theme: {theme}</p>
          </>
        )}

        {/* LOGOUT */}

        {section === "logout" && (
          <>
            <h2>Logout</h2>

            <p>
              This is a demo application. No real account session is connected.
            </p>

            <button
              type="button"
              className="danger-button"
              data-ai-action-id="logout-account"
              data-ai-description="Log out of the current Hourmaker account."
              data-ai-category="account-settings"
              data-ai-risk="high"
              onClick={() => alert("Demo logout clicked.")}
            >
              Logout
            </button>
          </>
        )}

        {/* INVALID SETTINGS SECTION */}

        {!sections.some((item) => item.id === section) && (
          <div>
            <h2>Settings section not found</h2>

            <button
              type="button"
              className="primary-button"
              data-ai-action-id="settings-back-to-profile"
              data-ai-description="Return to the account profile settings."
              data-ai-category="navigation"
              data-ai-risk="low"
              onClick={() => setParams({ section: "profile" })}
            >
              Back to Profile
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

// --------------------------------------------------
// BILLING PAGE
// --------------------------------------------------

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

        <button
          type="button"
          className="primary-button"
          data-ai-action-id="manage-billing-plan"
          data-ai-description="Open the billing plan management action."
          data-ai-category="billing"
          data-ai-risk="confirm"
          onClick={() => alert("Billing demo action.")}
        >
          Manage Plan
        </button>
      </div>
    </Layout>
  );
}

// --------------------------------------------------
// NOT FOUND PAGE
// --------------------------------------------------

function NotFound() {
  return (
    <Layout>
      <div className="content-card">
        <h2>Page not found</h2>

        <Link to="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    </Layout>
  );
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

export default function App() {
  const [members, setMembers] = useState(initialMembers);

  return (
    <CapabilityProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/team"
            element={
              <TeamPage
                members={members}
                setMembers={setMembers}
              />
            }
          />

          <Route
            path="/team/invite"
            element={
              <InvitePage
                members={members}
                setMembers={setMembers}
              />
            }
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/billing"
            element={<BillingPage />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </BrowserRouter>
    </CapabilityProvider>
  );
}