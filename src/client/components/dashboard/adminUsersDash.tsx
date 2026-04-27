import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { PulseLoader } from "react-spinners";
import { toast } from "sonner";
import SearchInput from "../searchInput";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import NoResultsCat from "../catErrors/noResultsCat";
import { useCompanies } from "../../hooks/useCompanies";
import {
  AdminUser,
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from "../../hooks/useAdminUsers";
import { PaginationControls } from "../paginationControls";
import SelectCompany from "../createBallot/selectCompany";

type AccountType = "Admin" | "Member" | "Officer" | "Employee";
type UserSortBy = "name" | "username" | "accountType" | "company";

type UserFormState = {
  userID?: number;
  username: string;
  fName: string;
  lName: string;
  password: string;
  accountType: AccountType;
  companyID: number;
  assignedCompanies: Set<number>;
};

const accountBadgeClass: Record<AccountType, string> = {
  Admin: "bg-red-900/40 text-red-200 border-red-700/60",
  Employee: "bg-sky-900/40 text-sky-200 border-sky-700/60",
  Officer: "bg-amber-900/40 text-amber-200 border-amber-700/60",
  Member: "bg-emerald-900/40 text-emerald-200 border-emerald-700/60",
};

function getDefaultForm(companies: Array<{ companyID?: number }>): UserFormState {
  const firstCompanyID = Number(companies[0]?.companyID ?? 0);
  return {
    username: "",
    fName: "",
    lName: "",
    password: "",
    accountType: "Member",
    companyID: firstCompanyID,
    assignedCompanies: new Set<number>(),
  };
}

function normalizeCompanyName(user: AdminUser): string {
  return user.company?.companyName ?? `Company #${user.companyID}`;
}

export default function AdminUsersDash() {
  const usersQuery = useAdminUsers();
  const companiesQuery = useCompanies();
  const createUserMutation = useCreateAdminUser();
  const updateUserMutation = useUpdateAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  const companies = useMemo(
    () =>
      ((companiesQuery.data ?? []) as Array<{ companyID?: number; companyName?: string }>)
        .filter((company) => Number.isFinite(company.companyID) && (company.companyID ?? 0) > 0)
        .map((company) => ({
          companyID: Number(company.companyID),
          companyName: company.companyName ?? `Company #${company.companyID}`,
        })),
    [companiesQuery.data],
  );

  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [roleFilter, setRoleFilter] = useState<"all" | AccountType>("all");
  const [companyFilterSet, setCompanyFilterSet] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<UserSortBy>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<UserFormState>(() => getDefaultForm(companies));

  const selectedFilterCompanyID = useMemo(() => {
    const first = companyFilterSet.values().next().value;
    return typeof first === "number" ? first : null;
  }, [companyFilterSet]);

  const selectedFormCompanySet = useMemo(() => {
    return form.companyID > 0 ? new Set<number>([form.companyID]) : new Set<number>();
  }, [form.companyID]);

  const setFormCompanySelection: Dispatch<SetStateAction<Set<number>>> = (next) => {
    const prevSelection =
      form.companyID > 0 ? new Set<number>([form.companyID]) : new Set<number>();
    const resolved = typeof next === "function" ? next(prevSelection) : next;
    const selected = resolved.values().next().value;
    setForm((prev) => ({
      ...prev,
      companyID: typeof selected === "number" ? selected : 0,
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 450);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, roleFilter, selectedFilterCompanyID, sortBy, sortDir]);

  const users = (usersQuery.data ?? []) as AdminUser[];
  const filteredUsers = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    const companyIDFilter = selectedFilterCompanyID;

    const withFilters = users.filter((user) => {
      const fullName = `${user.fName} ${user.lName}`.toLowerCase();
      const username = user.username.toLowerCase();
      const companyName = normalizeCompanyName(user).toLowerCase();

      if (normalized.length > 0 && !fullName.includes(normalized) && !username.includes(normalized)) {
        return false;
      }
      if (roleFilter !== "all" && user.accountType !== roleFilter) {
        return false;
      }
      if (companyIDFilter && user.companyID !== companyIDFilter) {
        return false;
      }
      if (normalized.length > 0 && !companyName.includes(normalized) && !fullName.includes(normalized) && !username.includes(normalized)) {
        return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return withFilters.sort((a, b) => {
      if (sortBy === "name") {
        return `${a.fName} ${a.lName}`.localeCompare(`${b.fName} ${b.lName}`) * dir;
      }
      if (sortBy === "username") {
        return a.username.localeCompare(b.username) * dir;
      }
      if (sortBy === "accountType") {
        return a.accountType.localeCompare(b.accountType) * dir;
      }
      return normalizeCompanyName(a).localeCompare(normalizeCompanyName(b)) * dir;
    });
  }, [users, debouncedQuery, roleFilter, selectedFilterCompanyID, sortBy, sortDir]);

  const LIMIT = 40;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / LIMIT));
  const pagedUsers = filteredUsers.slice(page * LIMIT, page * LIMIT + LIMIT);

  useEffect(() => {
    if (page >= totalPages) setPage(totalPages - 1);
  }, [page, totalPages]);

  const openCreateModal = () => {
    setFormError("");
    setForm(getDefaultForm(companies));
    setCreateOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setFormError("");
    setForm({
      userID: user.userID,
      username: user.username,
      fName: user.fName,
      lName: user.lName,
      password: "",
      accountType: user.accountType,
      companyID: user.companyID,
      assignedCompanies: new Set((user.employeeSocieties ?? []).map((row) => row.companyID)),
    });
    setEditOpen(true);
  };

  const toggleAssignedCompany = (companyID: number) => {
    setForm((prev) => {
      const assignedCompanies = new Set(prev.assignedCompanies);
      if (assignedCompanies.has(companyID)) assignedCompanies.delete(companyID);
      else assignedCompanies.add(companyID);
      return { ...prev, assignedCompanies };
    });
  };

  const validateForm = (isCreate: boolean): string => {
    if (!form.fName.trim() || !form.lName.trim() || !form.username.trim()) {
      return "First name, last name, and username are required.";
    }
    if (isCreate && form.password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!Number.isFinite(form.companyID) || form.companyID <= 0) {
      return "A company must be selected.";
    }
    return "";
  };

  const submitCreate = async () => {
    const validationError = validateForm(true);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      username: form.username.trim(),
      fName: form.fName.trim(),
      lName: form.lName.trim(),
      password: form.password,
      accountType: form.accountType,
      companyID: form.companyID,
      assignedCompanies: Array.from(form.assignedCompanies),
    } as const;

    await toast.promise(createUserMutation.mutateAsync(payload), {
      loading: "Creating user...",
      success: "User created successfully",
      error: (error: any) => error?.message ?? "Failed to create user",
    });
    setCreateOpen(false);
  };

  const submitEdit = async () => {
    const validationError = validateForm(false);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!form.userID) {
      setFormError("User ID is missing.");
      return;
    }

    const payload = {
      userID: form.userID,
      username: form.username.trim(),
      fName: form.fName.trim(),
      lName: form.lName.trim(),
      accountType: form.accountType,
      companyID: form.companyID,
      assignedCompanies: Array.from(form.assignedCompanies),
    } as const;

    await toast.promise(updateUserMutation.mutateAsync(payload), {
      loading: "Updating user...",
      success: "User updated successfully",
      error: (error: any) => error?.message ?? "Failed to update user",
    });
    setEditOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    await toast.promise(deleteUserMutation.mutateAsync(deleteTarget.userID), {
      loading: "Deleting user...",
      success: "User deleted successfully",
      error: (error: any) => error?.message ?? "Failed to delete user",
    });
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-300">
      <div className="p-4 space-y-4 flex flex-col">
        <h1 className="text-2xl text-slate-100">Edit Users Dashboard</h1>

        {!usersQuery.isLoading && !usersQuery.isError && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            sortBy="ballotName"
            sortDir={sortDir}
            status="all"
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <SearchInput
              type="text"
              placeholder="Search name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "all" | AccountType)}>
            <SelectTrigger className="w-36 bg-slate-900/30 border-slate-800 text-slate-200">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Employee">Employee</SelectItem>
              <SelectItem value="Officer">Officer</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full max-w-sm">
            <SelectCompany
              companiesData={companies}
              companiesIsLoading={companiesQuery.isLoading}
              companiesIsError={companiesQuery.isError}
              selectedCompanies={companyFilterSet}
              setSelectedCompanies={setCompanyFilterSet}
              placeholder="All Companies"
              label=""
              description=""
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
            onClick={() => setCompanyFilterSet(new Set())}
            disabled={companyFilterSet.size === 0}
          >
            All Companies
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as UserSortBy)}>
              <SelectTrigger className="w-36 bg-slate-900/30 border-slate-800 text-slate-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="username">Username</SelectItem>
                <SelectItem value="accountType">Role</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
              onClick={() => setSortDir((value) => (value === "asc" ? "desc" : "asc"))}
              aria-label="Toggle sort direction"
            >
              {sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>

            <Button
              className="border-slate-700 bg-slate-200/10 text-slate-100 hover:bg-slate-200/15"
              onClick={openCreateModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>
        </div>

        {usersQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <PulseLoader color="#cbd5e1" size={12} />
          </div>
        ) : usersQuery.isError ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <p className="text-slate-300">Error loading users</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {pagedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {pagedUsers.map((user) => (
                  <Card key={user.userID} className="border border-white/10 bg-slate-900/60">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base text-slate-100 leading-snug">
                          {user.fName} {user.lName}
                        </CardTitle>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            accountBadgeClass[user.accountType],
                          ].join(" ")}
                        >
                          {user.accountType}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p className="text-slate-300">
                        Username: <span className="text-slate-100">{user.username}</span>
                      </p>
                      <p className="text-slate-300">
                        Company: <span className="text-slate-100">{normalizeCompanyName(user)}</span>
                      </p>
                      <p className="text-slate-300">
                        User ID: <span className="text-slate-100">{user.userID}</span>
                      </p>
                      {user.accountType === "Employee" && (
                        <p className="text-slate-300">
                          Assigned:{" "}
                          <span className="text-slate-100">
                            {(user.employeeSocieties ?? [])
                              .map((assignment) => assignment.company?.companyName ?? `Company #${assignment.companyID}`)
                              .join(", ") || "None"}
                          </span>
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-800 bg-slate-900/30 text-slate-200 hover:bg-slate-800/60"
                          onClick={() => openEditModal(user)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-900/60 bg-red-950/20 text-red-200 hover:bg-red-900/30"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <NoResultsCat />
            )}

            {pagedUsers.length > 0 && (
              <PaginationControls
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                sortBy="ballotName"
                sortDir={sortDir}
                status="all"
              />
            )}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new user account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-fName">First Name</Label>
              <Input
                id="create-fName"
                value={form.fName}
                onChange={(e) => setForm((prev) => ({ ...prev, fName: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-lName">Last Name</Label>
              <Input
                id="create-lName"
                value={form.lName}
                onChange={(e) => setForm((prev) => ({ ...prev, lName: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={form.accountType} onValueChange={(value) => setForm((prev) => ({ ...prev, accountType: value as AccountType }))}>
                <SelectTrigger className="bg-slate-900/40 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Officer">Officer</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SelectCompany
              companiesData={companies}
              companiesIsLoading={companiesQuery.isLoading}
              companiesIsError={companiesQuery.isError}
              selectedCompanies={selectedFormCompanySet}
              setSelectedCompanies={setFormCompanySelection}
              label="Company"
              description=""
              placeholder="Select company"
            />
          </div>

          {form.accountType === "Employee" ? (
            <div className="space-y-2">
              <Label>Assigned Companies</Label>
              <ScrollArea className="h-36 rounded-md border border-slate-800 p-3">
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div key={`create-assigned-${company.companyID}`} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.assignedCompanies.has(company.companyID)}
                        onCheckedChange={() => toggleAssignedCompany(company.companyID)}
                        className="border-slate-700"
                      />
                      <span className="text-sm text-slate-200">{company.companyName}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-700 bg-slate-900/40">
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={createUserMutation.isPending}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fName">First Name</Label>
              <Input
                id="edit-fName"
                value={form.fName}
                onChange={(e) => setForm((prev) => ({ ...prev, fName: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lName">Last Name</Label>
              <Input
                id="edit-lName"
                value={form.lName}
                onChange={(e) => setForm((prev) => ({ ...prev, lName: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                className="bg-slate-900/40 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={form.accountType} onValueChange={(value) => setForm((prev) => ({ ...prev, accountType: value as AccountType }))}>
                <SelectTrigger className="bg-slate-900/40 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Officer">Officer</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SelectCompany
              companiesData={companies}
              companiesIsLoading={companiesQuery.isLoading}
              companiesIsError={companiesQuery.isError}
              selectedCompanies={selectedFormCompanySet}
              setSelectedCompanies={setFormCompanySelection}
              label="Company"
              description=""
              placeholder="Select company"
            />
          </div>

          {form.accountType === "Employee" ? (
            <div className="space-y-2">
              <Label>Assigned Companies</Label>
              <ScrollArea className="h-36 rounded-md border border-slate-800 p-3">
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div key={`edit-assigned-${company.companyID}`} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.assignedCompanies.has(company.companyID)}
                        onCheckedChange={() => toggleAssignedCompany(company.companyID)}
                        className="border-slate-700"
                      />
                      <span className="text-sm text-slate-200">{company.companyName}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-slate-700 bg-slate-900/40">
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={updateUserMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {deleteTarget
                ? `Are you sure you want to delete ${deleteTarget.fName} ${deleteTarget.lName}? This action cannot be undone.`
                : "Are you sure you want to delete this user?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 bg-slate-900/40 text-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-700 text-red-50 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
