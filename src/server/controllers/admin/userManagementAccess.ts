type ManagementRole = 'Admin' | 'Employee';
type ManageableAccountType = 'Officer' | 'Member';

type ScopedActor = {
    accountType: ManagementRole;
    assignedCompanyIDs: number[];
};

type ManagedUserLike = {
    accountType?: string;
    companyID?: number;
};

const MANAGEABLE_ACCOUNT_TYPES: ReadonlySet<string> = new Set<ManageableAccountType>([
    'Officer',
    'Member',
]);

function uniquePositiveCompanyIDs(companyIDs: number[] = []): number[] {
    return Array.from(
        new Set(
            companyIDs
                .map((companyID) => Number(companyID))
                .filter((companyID) => Number.isFinite(companyID) && companyID > 0),
        ),
    );
}

function isManageableAccountType(accountType: string): boolean {
    return MANAGEABLE_ACCOUNT_TYPES.has(accountType);
}

function employeeCanManageUser(actor: ScopedActor, user: ManagedUserLike): boolean {
    if (actor.accountType !== 'Employee') return true;
    if (!user || !isManageableAccountType(String(user.accountType ?? ''))) return false;
    const companyID = Number(user.companyID);
    if (!Number.isFinite(companyID) || companyID <= 0) return false;
    return actor.assignedCompanyIDs.includes(companyID);
}

function assertEmployeeCreateScope(
    actor: ScopedActor,
    payload: { accountType: string; companyID: number; assignedCompanies?: number[] },
): void {
    if (actor.accountType !== 'Employee') return;

    if (!isManageableAccountType(payload.accountType)) {
        throw new Error('Forbidden account type');
    }

    if (!actor.assignedCompanyIDs.includes(Number(payload.companyID))) {
        throw new Error('Forbidden company');
    }

    const normalizedAssigned = uniquePositiveCompanyIDs(payload.assignedCompanies ?? []);
    if (normalizedAssigned.some((companyID) => !actor.assignedCompanyIDs.includes(companyID))) {
        throw new Error('Forbidden assigned company');
    }
}

function assertEmployeeUpdateScope(
    actor: ScopedActor,
    existingUser: ManagedUserLike,
    payload: { accountType: string; companyID: number; assignedCompanies?: number[] },
): void {
    if (actor.accountType !== 'Employee') return;

    if (!employeeCanManageUser(actor, existingUser)) {
        throw new Error('Forbidden target user');
    }

    assertEmployeeCreateScope(actor, payload);
}

function assertEmployeeDeleteScope(actor: ScopedActor, existingUser: ManagedUserLike): void {
    if (actor.accountType !== 'Employee') return;
    if (!employeeCanManageUser(actor, existingUser)) {
        throw new Error('Forbidden target user');
    }
}

function filterUsersForActor<T extends ManagedUserLike>(actor: ScopedActor, users: T[]): T[] {
    if (actor.accountType === 'Admin') return users;
    return users.filter((user) => employeeCanManageUser(actor, user));
}

export {
    uniquePositiveCompanyIDs,
    isManageableAccountType,
    employeeCanManageUser,
    assertEmployeeCreateScope,
    assertEmployeeUpdateScope,
    assertEmployeeDeleteScope,
    filterUsersForActor,
};
export type { ScopedActor, ManagementRole };
