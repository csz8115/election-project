import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type EmployeeSocietyAssignment = {
  companyID: number;
  company?: {
    companyName?: string;
  };
};

export type AdminUser = {
  userID: number;
  username: string;
  fName: string;
  lName: string;
  accountType: "Admin" | "Member" | "Officer" | "Employee";
  companyID: number;
  company?: {
    companyName?: string;
  };
  employeeSocieties?: EmployeeSocietyAssignment[];
};

export type CreateAdminUserPayload = {
  username: string;
  fName: string;
  lName: string;
  password: string;
  accountType: "Admin" | "Member" | "Officer" | "Employee";
  companyID: number;
  assignedCompanies?: number[];
};

export type UpdateAdminUserPayload = {
  userID: number;
  username: string;
  fName: string;
  lName: string;
  accountType: "Admin" | "Member" | "Officer" | "Employee";
  companyID: number;
  assignedCompanies?: number[];
};

async function parseApiResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data;
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/admin/getAllUsers`, {
        method: "GET",
        credentials: "include",
      });
      return parseApiResponse(response);
    },
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 2,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAdminUserPayload) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/admin/createUser`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateAdminUserPayload) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/admin/updateUser`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return parseApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userID: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}api/v1/admin/deleteUser`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID }),
      });
      return parseApiResponse(response);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}
