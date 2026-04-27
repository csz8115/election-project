import {
  assertEmployeeCreateScope,
  assertEmployeeDeleteScope,
  assertEmployeeUpdateScope,
  filterUsersForActor,
  uniquePositiveCompanyIDs,
} from "../../../src/server/controllers/admin/userManagementAccess.ts";

describe("userManagementAccess", () => {
  const employeeActor = {
    accountType: "Employee" as const,
    assignedCompanyIDs: [10, 20],
  };

  test("uniquePositiveCompanyIDs keeps unique positive numeric ids", () => {
    expect(uniquePositiveCompanyIDs([10, 10, 20, -1, 0, Number.NaN])).toEqual([10, 20]);
  });

  test("filterUsersForActor returns only Officer/Member users in assigned companies for employees", () => {
    const filtered = filterUsersForActor(employeeActor, [
      { userID: 1, accountType: "Officer", companyID: 10 },
      { userID: 2, accountType: "Member", companyID: 20 },
      { userID: 3, accountType: "Admin", companyID: 10 },
      { userID: 4, accountType: "Employee", companyID: 10 },
      { userID: 5, accountType: "Member", companyID: 999 },
    ]);

    expect(filtered.map((user) => user.userID)).toEqual([1, 2]);
  });

  test("assertEmployeeCreateScope rejects forbidden account type/company", () => {
    expect(() =>
      assertEmployeeCreateScope(employeeActor, {
        accountType: "Admin",
        companyID: 10,
      }),
    ).toThrow("Forbidden account type");

    expect(() =>
      assertEmployeeCreateScope(employeeActor, {
        accountType: "Officer",
        companyID: 999,
      }),
    ).toThrow("Forbidden company");
  });

  test("assertEmployeeUpdateScope rejects editing non-manageable targets", () => {
    expect(() =>
      assertEmployeeUpdateScope(
        employeeActor,
        { accountType: "Admin", companyID: 10 },
        { accountType: "Officer", companyID: 10 },
      ),
    ).toThrow("Forbidden target user");
  });

  test("assertEmployeeDeleteScope rejects deleting target outside scope", () => {
    expect(() =>
      assertEmployeeDeleteScope(employeeActor, { accountType: "Member", companyID: 999 }),
    ).toThrow("Forbidden target user");
  });
});

