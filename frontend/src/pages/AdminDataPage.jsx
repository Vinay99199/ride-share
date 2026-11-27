import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { adminApi } from "../api/admin";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/LocationPicker";
import { OrganizationLogo, UserAvatar, VehicleVisual } from "../components/VisualAssets";
import {
  Button,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  Panel,
  SelectField,
  Spinner,
  Status,
  formatDate,
  rideLocation,
} from "../components/UI";

const pageTitles = {
  users: "User management",
  organizations: "Organization management",
  monitoring: "Ride and booking monitoring",
  reports: "Reports and ratings",
  analytics: "Platform analytics",
  audit: "Administration audit log",
};

const emptyOrganization = {
  name: "",
  shortName: "",
  type: "company",
  city: "",
  state: "Uttar Pradesh",
  country: "India",
  address: "",
  adminId: "",
  isActive: true,
  approvalStatus: "approved",
  approvalReason: "",
  reason: "",
};

const Table = ({ headings, children }) => (
  <div className="admin-table-wrap">
    <table className="admin-table">
      <thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Pagination = ({ page, totalPages, onPageChange }) => (
  totalPages > 1 && (
    <div className="admin-pagination">
      <Button
        type="button"
        variant="outline"
        className="button-small"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span>Page {page} of {totalPages}</span>
      <Button
        type="button"
        variant="outline"
        className="button-small"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
);

const monthLabel = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatSeriesLabel = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClass = (value) => {
  const key = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return ["registrations", "scheduled", "completed", "cancelled", "pending", "confirmed", "rejected"].includes(key)
    ? `analytics-status-${key}`
    : "analytics-status-other";
};

const monthlySeries = (records, defaultSeriesLabel) => {
  const months = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const year = Number(record?._id?.year);
    const month = Number(record?._id?.month);
    const count = Number(record?.count);
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isFinite(count) ||
      count < 0
    ) {
      continue;
    }

    const key = `${year}-${String(month).padStart(2, "0")}`;
    if (!months.has(key)) {
      months.set(key, {
        key,
        label: monthLabel.format(new Date(Date.UTC(year, month - 1, 1))),
        values: {},
      });
    }
    const status = typeof record?._id?.status === "string"
      ? record._id.status
      : defaultSeriesLabel;
    const values = months.get(key).values;
    values[status] = (values[status] || 0) + count;
  }
  return [...months.values()].sort((left, right) => left.key.localeCompare(right.key));
};

const TrendPanel = ({ title, records, defaultSeriesLabel }) => {
  const rows = monthlySeries(records, defaultSeriesLabel);
  const series = [...new Set(rows.flatMap((row) => Object.keys(row.values)))].sort();
  const maximum = Math.max(
    1,
    ...rows.map((row) => Object.values(row.values).reduce((sum, value) => sum + value, 0))
  );

  return (
    <Panel title={title}>
      {rows.length ? (
        <div className="analytics-chart">
          <div className="analytics-legend" aria-label="Chart legend">
            {series.map((name) => (
              <span key={name}>
                <i className={`analytics-legend-swatch ${statusClass(name)}`} />
                {formatSeriesLabel(name)}
              </span>
            ))}
          </div>
          <div className="analytics-chart-rows">
            {rows.map((row) => {
              const total = Object.values(row.values).reduce((sum, value) => sum + value, 0);
              const description = series
                .map((name) => `${formatSeriesLabel(name)}: ${row.values[name] || 0}`)
                .join(", ");
              return (
                <div className="analytics-chart-row" key={row.key}>
                  <span className="analytics-chart-month">{row.label}</span>
                  <div
                    className="analytics-chart-track"
                    role="img"
                    aria-label={`${row.label}: ${description}`}
                  >
                    {series.map((name) => {
                      const count = row.values[name] || 0;
                      return count > 0 ? (
                        <span
                          key={name}
                          className={`analytics-chart-segment ${statusClass(name)}`}
                          style={{ width: `${(count / maximum) * 100}%` }}
                          title={`${formatSeriesLabel(name)}: ${count}`}
                        />
                      ) : null;
                    })}
                  </div>
                  <strong className="analytics-chart-total">{total.toLocaleString()}</strong>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState title="No trend data available" description="Monthly activity will appear here when records are available." />
      )}
    </Panel>
  );
};

const AdminDataPage = () => {
  const { section } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [identityFilter, setIdentityFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [reasons, setReasons] = useState({});
  const [roleChanges, setRoleChanges] = useState({});
  const [organizationForm, setOrganizationForm] = useState(emptyOrganization);
  const [domainForm, setDomainForm] = useState({
    organizationId: "",
    domain: "",
    reason: "",
  });
  const [editingOrganizationId, setEditingOrganizationId] = useState("");
  const [workingId, setWorkingId] = useState("");
  const loadSequence = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++loadSequence.current;
    setLoading(true);
    setError("");
    setData(null);
    try {
      let result;
      if (section === "users") {
        result = await adminApi.users({
          page,
          limit: 20,
          search,
          ...(roleFilter ? { role: roleFilter } : {}),
          ...(identityFilter ? { verificationStatus: identityFilter } : {}),
          ...(activeFilter ? { isActive: activeFilter } : {}),
        });
      } else if (section === "organizations") {
        result = await adminApi.organizations({
          page,
          limit: 20,
          search,
          ...(activeFilter ? { isActive: activeFilter } : {}),
        });
      } else if (section === "monitoring") {
        const [rides, bookings] = await Promise.all([
          adminApi.rides({ page, limit: 20 }),
          adminApi.bookings({ page, limit: 20 }),
        ]);
        result = { rides, bookings };
      } else if (section === "reports") {
        const [reports, ratings] = await Promise.all([
          adminApi.reports({ page, limit: 20 }),
          adminApi.ratings({ page, limit: 20 }),
        ]);
        result = { reports, ratings };
      } else if (section === "analytics") {
        const [dashboard, analytics] = await Promise.all([
          adminApi.dashboard(),
          adminApi.analytics(),
        ]);
        result = { dashboard: dashboard.stats, analytics };
      } else if (section === "audit") {
        result = await adminApi.auditLogs({ page, limit: 20 });
      } else {
        result = null;
      }
      if (requestId === loadSequence.current) setData(result);
    } catch (requestError) {
      if (requestId === loadSequence.current) {
        setError(errorMessage(requestError));
      }
    } finally {
      if (requestId === loadSequence.current) setLoading(false);
    }
  }, [activeFilter, identityFilter, page, roleFilter, search, section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!pageTitles[section]) return <Navigate to="/admin" replace />;
  if (section === "organizations" && user?.role !== "superAdmin") {
    return <Navigate to="/admin" replace />;
  }

  const runAction = async (id, action, successMessage) => {
    setWorkingId(id);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(successMessage);
      await loadData();
      return true;
    } catch (requestError) {
      setError(errorMessage(requestError));
      return false;
    } finally {
      setWorkingId("");
    }
  };

  const setOrganizationField = (field, value) =>
    setOrganizationForm((current) => ({ ...current, [field]: value }));

  const saveOrganization = async (event) => {
    event.preventDefault();
    const body = {
      name: organizationForm.name,
      shortName: organizationForm.shortName,
      type: organizationForm.type,
      city: organizationForm.city,
      state: organizationForm.state,
      country: organizationForm.country,
      address: organizationForm.address,
      adminId: organizationForm.adminId.trim() || null,
      isActive: organizationForm.isActive,
      ...(editingOrganizationId
        ? {
            approvalStatus: organizationForm.approvalStatus,
            approvalReason: organizationForm.approvalReason.trim(),
          }
        : {}),
      ...(organizationForm.reason.trim()
        ? { reason: organizationForm.reason.trim() }
        : {}),
    };
    const saved = await runAction(
      editingOrganizationId || "new",
      () =>
        editingOrganizationId
          ? adminApi.updateOrganization(editingOrganizationId, body)
          : adminApi.createOrganization(body),
      editingOrganizationId ? "Organization updated." : "Organization created."
    );
    if (saved) {
      setEditingOrganizationId("");
      setOrganizationForm(emptyOrganization);
    }
  };

  const verifyDomain = async (event) => {
    event.preventDefault();
    const saved = await runAction(
      `domain-${domainForm.organizationId}`,
      () =>
        adminApi.verifyOrganizationDomain(domainForm.organizationId, {
          domain: domainForm.domain.trim(),
          reason: domainForm.reason.trim(),
        }),
      "Official email domain verified and recorded in the audit log."
    );
    if (saved) {
      setDomainForm((current) => ({ ...current, domain: "", reason: "" }));
    }
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="AUTHORIZED ADMINISTRATION"
        title={pageTitles[section]}
        description={`${user?.role === "superAdmin" ? "Platform-wide" : "Organization-scoped"} data · signed in as ${user?.role}.`}
      />
      {error && <Notice>{error}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      {loading ? <Spinner label="Loading authorized admin data..." /> : (
        <>
          {section === "users" && (
            <Panel title="Users">
              <form className="admin-search-form" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchText.trim()); }}>
                <Field label="Search name, email or phone" value={searchText} maxLength="100" onChange={(event) => setSearchText(event.target.value)} />
                <SelectField label="Role" value={roleFilter} onChange={(event) => { setPage(1); setRoleFilter(event.target.value); }}>
                  <option value="">All roles</option><option value="user">User</option><option value="organizationAdmin">Organization admin</option><option value="superAdmin">SuperAdmin</option>
                </SelectField>
                <SelectField label="Identity status" value={identityFilter} onChange={(event) => { setPage(1); setIdentityFilter(event.target.value); }}>
                  <option value="">All statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
                </SelectField>
                <SelectField label="Account" value={activeFilter} onChange={(event) => { setPage(1); setActiveFilter(event.target.value); }}>
                  <option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option>
                </SelectField>
                <Button type="submit" className="button-small">Search</Button>
              </form>
              {data?.users?.length ? (
                <Table headings={["User", "Organization", "Role", "Identity", "Account"]}>
                  {data.users.map((item) => {
                    const active = item.isActive !== false;
                    return (
                      <tr key={item._id}>
                        <td><div className="admin-person-cell"><UserAvatar name={item.name} size="small" /><div><strong>{item.name}</strong><br /><span>{item.email}</span><br /><span>{item.phone}</span></div></div></td>
                        <td>{item.organization?.name ? <div className="admin-organization-cell"><OrganizationLogo name={item.organization.name} shortName={item.organization.shortName} />{item.organization.name}</div> : "—"}</td>
                        <td>
                          {item.role}
                          {user?.role === "superAdmin" && item._id !== user?._id && (
                            <div className="admin-role-editor">
                              <SelectField
                                label={`Change role for ${item.name}`}
                                value={roleChanges[item._id]?.role || item.role}
                                onChange={(event) => setRoleChanges((current) => ({
                                  ...current,
                                  [item._id]: {
                                    ...current[item._id],
                                    role: event.target.value,
                                  },
                                }))}
                              >
                                {item.role === "user" && (
                                  <option value="user">Legacy user</option>
                                )}
                                {item.role === "organization" && (
                                  <option value="organization">Organization account</option>
                                )}
                                <option value="passenger">Passenger</option>
                                <option value="driver">Driver</option>
                                <option value="organizationAdmin">Organization admin</option>
                                <option value="superAdmin">SuperAdmin</option>
                              </SelectField>
                              <textarea
                                aria-label={`Reason for changing ${item.name}'s role`}
                                placeholder="Audit reason (5-500 chars)"
                                minLength="5"
                                maxLength="500"
                                value={roleChanges[item._id]?.reason || ""}
                                onChange={(event) => setRoleChanges((current) => ({
                                  ...current,
                                  [item._id]: {
                                    ...current[item._id],
                                    reason: event.target.value,
                                  },
                                }))}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="button-small"
                                disabled={
                                  workingId === `role-${item._id}` ||
                                  (roleChanges[item._id]?.role || item.role) === item.role ||
                                  (roleChanges[item._id]?.reason || "").trim().length < 5
                                }
                                onClick={async () => {
                                  const saved = await runAction(
                                    `role-${item._id}`,
                                    () => adminApi.setUserRole(item._id, {
                                      role: roleChanges[item._id].role,
                                      reason: roleChanges[item._id].reason.trim(),
                                    }),
                                    "Account role updated and recorded in the audit log."
                                  );
                                  if (saved) {
                                    setRoleChanges((current) => {
                                      const next = { ...current };
                                      delete next[item._id];
                                      return next;
                                    });
                                  }
                                }}
                              >
                                Save role
                              </Button>
                            </div>
                          )}
                        </td>
                        <td><Status value={item.verificationStatus} /></td>
                        <td>
                          <Status value={active ? "active" : "inactive"} />
                          {["user", "passenger", "driver"].includes(item.role) && item._id !== user?._id && (
                            <>
                              <textarea
                                aria-label={`Reason for changing ${item.name}'s account status`}
                                placeholder="Reason (5-500 chars)"
                                maxLength="500"
                                value={reasons[item._id] || ""}
                                onChange={(event) => setReasons((current) => ({ ...current, [item._id]: event.target.value }))}
                              />
                              <Button
                                type="button"
                                variant={active ? "outline" : "primary"}
                                className="button-small"
                                disabled={workingId === item._id || (reasons[item._id] || "").trim().length < 5}
                                onClick={() => runAction(
                                  item._id,
                                  () => adminApi.setUserActive(item._id, {
                                    isActive: !active,
                                    reason: reasons[item._id].trim(),
                                  }),
                                  `User account ${active ? "deactivated" : "activated"}.`
                                )}
                              >
                                {active ? "Deactivate" : "Activate"}
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              ) : <EmptyState title="No users found" description="Try a different search." />}
              <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
            </Panel>
          )}

          {section === "organizations" && (
            <div className="admin-data-grid">
              <Panel title={editingOrganizationId ? "Edit organization" : "Create organization"}>
                <form className="admin-form-grid" onSubmit={saveOrganization}>
                  <Field label="Organization name" required value={organizationForm.name} maxLength="120" onChange={(event) => setOrganizationField("name", event.target.value)} />
                  <Field label="Short name (optional)" value={organizationForm.shortName} maxLength="40" onChange={(event) => setOrganizationField("shortName", event.target.value)} />
                  <SelectField label="Type" value={organizationForm.type} onChange={(event) => setOrganizationField("type", event.target.value)}>
                    <option value="company">Company</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                    <option value="institute">Institute</option>
                    <option value="school">School</option>
                    <option value="institution">Institution</option>
                    <option value="other">Other</option>
                  </SelectField>
                  <Field label="City" value={organizationForm.city} maxLength="100" onChange={(event) => setOrganizationField("city", event.target.value)} />
                  <Field label="State" value={organizationForm.state} maxLength="100" onChange={(event) => setOrganizationField("state", event.target.value)} />
                  <Field label="Country" value={organizationForm.country} maxLength="100" onChange={(event) => setOrganizationField("country", event.target.value)} />
                  <LocationPicker
                    key={editingOrganizationId || "new-organization-address"}
                    label="Organization address"
                    initialQuery={organizationForm.address}
                    onChange={(location) =>
                      setOrganizationField("address", location?.address || "")
                    }
                  />
                  <Notice type="info">
                    Email domains are empty and pending until verified separately using official institutional evidence.
                  </Notice>
                  <Field label="Organization admin user ID (optional)" value={organizationForm.adminId} onChange={(event) => setOrganizationField("adminId", event.target.value)} />
                  <SelectField label="Account status" value={String(organizationForm.isActive)} onChange={(event) => setOrganizationField("isActive", event.target.value === "true")}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </SelectField>
                  {editingOrganizationId && (
                    <>
                      <SelectField label="Verification decision" value={organizationForm.approvalStatus} onChange={(event) => {
                        const approvalStatus = event.target.value;
                        setOrganizationForm((current) => ({
                          ...current,
                          approvalStatus,
                          ...(approvalStatus === "approved" ? { approvalReason: "" } : {}),
                        }));
                      }}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </SelectField>
                      <Field label="Decision reason (required to reject)" value={organizationForm.approvalReason} maxLength="500" onChange={(event) => setOrganizationField("approvalReason", event.target.value)} />
                    </>
                  )}
                  <Field label="Audit reason (optional, 5-500 chars)" value={organizationForm.reason} maxLength="500" onChange={(event) => setOrganizationField("reason", event.target.value)} />
                  <div className="inline-actions">
                    <Button type="submit" disabled={workingId === (editingOrganizationId || "new")}>{editingOrganizationId ? "Save changes" : "Create organization"}</Button>
                    {editingOrganizationId && <Button type="button" variant="outline" onClick={() => { setEditingOrganizationId(""); setOrganizationForm(emptyOrganization); }}>Cancel</Button>}
                  </div>
                </form>
              </Panel>
              <Panel title="Verify an official email domain">
                <form className="admin-form-grid" onSubmit={verifyDomain}>
                  <SelectField
                    label="Organization"
                    required
                    value={domainForm.organizationId}
                    onChange={(event) =>
                      setDomainForm((current) => ({
                        ...current,
                        organizationId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select an organization</option>
                    {(data?.organizations || []).map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}{item.city ? ` · ${item.city}` : ""}
                      </option>
                    ))}
                  </SelectField>
                  <Field
                    label="Official institutional email domain"
                    required
                    maxLength="253"
                    placeholder="example.ac.in"
                    value={domainForm.domain}
                    onChange={(event) =>
                      setDomainForm((current) => ({
                        ...current,
                        domain: event.target.value,
                      }))
                    }
                  />
                  <Field
                    label="Official evidence reviewed (audit reason)"
                    required
                    minLength="10"
                    maxLength="500"
                    value={domainForm.reason}
                    onChange={(event) =>
                      setDomainForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                  />
                  <p className="field-note">
                    Only SuperAdmins can approve a domain. Confirm its official association with the institution before submitting; common personal email providers are rejected.
                  </p>
                  <Button
                    type="submit"
                    disabled={
                      !domainForm.organizationId ||
                      domainForm.domain.trim().length === 0 ||
                      domainForm.reason.trim().length < 10 ||
                      workingId === `domain-${domainForm.organizationId}`
                    }
                  >
                    Verify domain
                  </Button>
                </form>
              </Panel>
              <Panel title="Organizations">
                <form className="admin-search-form" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchText.trim()); }}>
                  <Field label="Search name, city or domain" value={searchText} maxLength="100" onChange={(event) => setSearchText(event.target.value)} />
                  <SelectField label="Account" value={activeFilter} onChange={(event) => { setPage(1); setActiveFilter(event.target.value); }}>
                    <option value="">All accounts</option><option value="true">Active</option><option value="false">Inactive</option>
                  </SelectField>
                  <Button type="submit" className="button-small">Search</Button>
                </form>
                {data?.organizations?.length ? (
                  <Table headings={["Organization", "City", "Verified / pending domains", "Domain", "Approval", "Account", "Admin", "Actions"]}>
                    {data.organizations.map((item) => (
                      <tr key={item._id}>
                        <td><div className="admin-organization-cell"><OrganizationLogo name={item.name} shortName={item.shortName} /><div><strong>{item.name}</strong>{item.shortName && <><br /><span>{item.shortName}</span></>}<br /><span>{item.type}</span></div></div></td>
                        <td>{[item.city, item.state].filter(Boolean).join(", ") || "—"}</td>
                        <td>
                          <span>Verified: {item.verifiedDomains?.join(", ") || "—"}</span>
                          <br />
                          <span>Pending: {(item.allowedDomains || [])
                            .filter((domain) => !(item.verifiedDomains || []).includes(domain))
                            .join(", ") || "—"}</span>
                        </td>
                        <td><Status value={item.domainVerificationStatus || "pending"} /></td>
                        <td><Status value={item.approvalStatus || "approved"} /></td>
                        <td><Status value={item.isActive === false ? "inactive" : "active"} /></td>
                        <td>{item.adminId || "Unassigned"}</td>
                        <td><Button type="button" variant="outline" className="button-small" onClick={() => {
                          setEditingOrganizationId(item._id);
                          setOrganizationForm({
                            name: item.name,
                            shortName: item.shortName || "",
                            type: item.type,
                            city: item.city || "",
                            state: item.state || "",
                            country: item.country || "",
                            address: item.address || "",
                            adminId: item.adminId || "",
                            isActive: item.isActive !== false,
                            approvalStatus: item.approvalStatus || "approved",
                            approvalReason: item.approvalReason || "",
                            reason: "",
                          });
                        }}>Edit</Button></td>
                      </tr>
                    ))}
                  </Table>
                ) : <EmptyState title="No organizations found" />}
                <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
              </Panel>
            </div>
          )}

          {section === "monitoring" && (
            <div className="admin-data-grid">
              <Panel title={`Rides (${data?.rides?.total || 0})`}>
                {data?.rides?.rides?.length ? <Table headings={["Driver", "Route", "Departure", "Status"]}>
                  {data.rides.rides.map((ride) => <tr key={ride._id}>
                    <td><div className="admin-person-cell"><UserAvatar name={ride.driver?.name} size="small" /><div>{ride.driver?.name || "—"}<br /><span>{ride.driver?.organization?.name || ""}</span></div></div></td>
                    <td><div className="admin-ride-route"><VehicleVisual type={ride.vehicleType} className="admin-vehicle-visual" /><span>{rideLocation(ride, "pickup")} → {rideLocation(ride, "drop")}</span></div></td>
                    <td>{formatDate(ride.departureTime)}</td>
                    <td><Status value={ride.status} /></td>
                  </tr>)}
                </Table> : <EmptyState title="No rides in scope" /> }
                <Pagination page={data?.rides?.page || page} totalPages={data?.rides?.totalPages || 1} onPageChange={setPage} />
              </Panel>
              <Panel title={`Bookings (${data?.bookings?.total || 0})`}>
                {data?.bookings?.bookings?.length ? <Table headings={["Passenger", "Driver", "Ride", "Status"]}>
                  {data.bookings.bookings.map((booking) => <tr key={booking._id}>
                    <td><div className="admin-person-cell"><UserAvatar name={booking.passenger?.name} size="small" />{booking.passenger?.name || "—"}</div></td>
                    <td><div className="admin-person-cell"><UserAvatar name={booking.ride?.driver?.name} size="small" />{booking.ride?.driver?.name || "—"}</div></td>
                    <td>{formatDate(booking.ride?.departureTime)}</td>
                    <td><Status value={booking.status} /></td>
                  </tr>)}
                </Table> : <EmptyState title="No bookings in scope" /> }
                <Pagination page={data?.bookings?.page || page} totalPages={data?.bookings?.totalPages || 1} onPageChange={setPage} />
              </Panel>
            </div>
          )}

          {section === "reports" && (
            <div className="admin-data-grid">
              <Panel title={`Reports (${data?.reports?.total || 0})`}>
                {data?.reports?.reports?.length ? <Table headings={["Reporter", "Type / Description", "Booking", "Status", "Review"]}>
                  {data.reports.reports.map((report) => <tr key={report._id}>
                    <td>{report.user?.name || "—"}</td>
                    <td><strong>{report.type}</strong><br /><span>{report.description}</span></td>
                    <td>{report.booking?._id || report.booking || "—"}</td>
                    <td><Status value={report.status} /></td>
                    <td>
                      <SelectField label="Status" value={reasons[`status-${report._id}`] || "reviewed"} onChange={(event) => setReasons((current) => ({ ...current, [`status-${report._id}`]: event.target.value }))}>
                        <option value="reviewed">Reviewed</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option>
                      </SelectField>
                      <textarea aria-label="Report review reason" placeholder="Reason (5-500 chars)" maxLength="500" value={reasons[report._id] || ""} onChange={(event) => setReasons((current) => ({ ...current, [report._id]: event.target.value }))} />
                      <Button type="button" className="button-small" disabled={workingId === report._id || (reasons[report._id] || "").trim().length < 5} onClick={() => runAction(report._id, () => adminApi.reviewReport(report._id, { status: reasons[`status-${report._id}`] || "reviewed", reason: reasons[report._id].trim() }), "Report review saved.")}>Save review</Button>
                    </td>
                  </tr>)}
                </Table> : <EmptyState title="No reports in scope" description="Reports submitted by ride participants appear here." />}
                <Pagination page={data?.reports?.page || page} totalPages={data?.reports?.totalPages || 1} onPageChange={setPage} />
              </Panel>
              <Panel title={`Ratings (${data?.ratings?.total || 0}) · average ${Number(data?.ratings?.summary?.average || 0).toFixed(2)}`}>
                {data?.ratings?.ratings?.length ? <Table headings={["Reviewer", "Reviewed user", "Rating", "Review", "Date"]}>
                  {data.ratings.ratings.map((rating) => <tr key={rating._id}>
                    <td>{rating.reviewer?.name || "—"}</td><td>{rating.reviewee?.name || "—"}</td><td>{rating.rating}/5</td><td>{rating.review || "—"}</td><td>{formatDate(rating.createdAt)}</td>
                  </tr>)}
                </Table> : <EmptyState title="No reviews in scope" />}
              </Panel>
            </div>
          )}

          {section === "analytics" && (
            <>
              <div className="stat-grid">
                {Object.entries(data?.dashboard || {}).map(([label, value]) => (
                  <Panel key={label} className="stat-card"><span>{label.replaceAll(/([A-Z])/g, " $1")}</span><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong></Panel>
                ))}
              </div>
              <div className="admin-data-grid">
                <TrendPanel
                  title="Registration trends"
                  records={data?.analytics?.registrationTrends}
                  defaultSeriesLabel="registrations"
                />
                <TrendPanel
                  title="Ride trends"
                  records={data?.analytics?.rideTrends}
                  defaultSeriesLabel="rides"
                />
                <TrendPanel
                  title="Booking trends"
                  records={data?.analytics?.bookingTrends}
                  defaultSeriesLabel="bookings"
                />
                <Panel title="Organization activity">
                  {data?.analytics?.organizationActivity?.length ? (
                    <Table headings={["Organization", "Status", "Members", "Rides", "Bookings"]}>
                      {data.analytics.organizationActivity.map((organization) => (
                        <tr key={organization._id}>
                          <td><div className="admin-organization-cell"><OrganizationLogo name={organization.name} />{organization.name || "Unnamed organization"}</div></td>
                          <td><Status value={organization.isActive === false ? "inactive" : "active"} /></td>
                          <td>{Number(organization.users || 0).toLocaleString()}</td>
                          <td>{Number(organization.rides || 0).toLocaleString()}</td>
                          <td>{Number(organization.bookings || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </Table>
                  ) : (
                    <EmptyState title="No organization activity" description="Organization members, rides, and bookings will appear here." />
                  )}
                </Panel>
              </div>
            </>
          )}

          {section === "audit" && (
            <Panel title={`Audit events (${data?.total || 0})`}>
              {data?.auditLogs?.length ? <Table headings={["Time", "Administrator", "Action", "Organization", "Entity", "Reason"]}>
                {data.auditLogs.map((entry) => <tr key={entry._id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{entry.admin?.name || entry.admin?.email || "—"}</td>
                  <td>{entry.action}</td>
                  <td>{entry.organization?.name || "Platform"}</td>
                  <td>{entry.entityType} · {entry.entityId}</td>
                  <td>{entry.reason || "—"}</td>
                </tr>)}
              </Table> : <EmptyState title="No audit events yet" />}
              <Pagination page={data?.page || page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
            </Panel>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDataPage;
