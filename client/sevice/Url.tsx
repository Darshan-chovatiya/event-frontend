// export const BaseUrl = "https://vtwfkr7c-3100.inc1.devtunnels.ms"
export const BaseUrl = "https://3hvwwzp8-3100.inc1.devtunnels.ms"



export const AmazonAws = "https://itfuturz.s3.ap-south-1.amazonaws.com"





// import { useState, useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Plus,
//   Edit,
//   Trash2,
//   Search,
//   UserCheck,
//   UserX,
//   Mail,
//   Phone,
// } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { BaseUrl } from "@/sevice/Url";


// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: "super-admin" | "sub-admin";
//   status: "active" | "inactive";
//   phone: string;
//   joinDate: string;
// }

// const UserManagement: React.FC = () => {
//   const { user } = useAuth();
//   const { toast } = useToast();
//   const [users, setUsers] = useState<User[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedRole, setSelectedRole] = useState<string>("all");
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     totalPages: 1,
//   });

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "",
//     status: "active" as "active" | "inactive",
//     phone: "",
//   });

//   const roles = ["super-admin", "sub-admin"];

//   const fetchUsers = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const response = await fetch(`${BaseUrl}/admin/get-admin-details`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//         body: JSON.stringify({
//           search: searchTerm,
//           status: selectedRole === "all" ? undefined : selectedRole === "super-admin" ? "active" : "inActive",
//           page: pagination.page,
//           limit: pagination.limit,
//         }),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.message || "Failed to fetch users");
//       }

//       const data = await response.json();
//       const mappedUsers: User[] = data.data.docs.map((admin: any) => ({
//         id: admin._id,
//         name: admin.name || "Unnamed",
//         email: admin.email,
//         role: admin.role === "superadmin" ? "super-admin" : "sub-admin",
//         status: admin.status === "inActive" ? "inactive" : "active",
//         phone: admin.mobile || "",
//         joinDate: admin.createdAt ? new Date(admin.createdAt).toISOString().split("T")[0] : "",
//       }));

//       setUsers(mappedUsers);
//       setPagination({
//         page: data.data.page,
//         limit: data.data.limit,
//         total: data.data.totalDocs,
//         totalPages: data.data.totalPages,
//       });
//     } catch (err: any) {
//       setError(err.message || "Failed to fetch users");
//       toast({ variant: "destructive", title: "Error", description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, [searchTerm, selectedRole, pagination.page]);

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       email: "",
//       password: "",
//       role: "",
//       status: "active",
//       phone: "",
//     });
//     setError("");
//   };

//   const validateForm = () => {
//     if (!formData.name || !formData.email || !formData.role || (!formData.password && !editingUser)) {
//       setError("Please fill in all required fields (Name, Email, Role, Password)");
//       toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields" });
//       return false;
//     }
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(formData.email)) {
//       setError("Please enter a valid email address");
//       toast({ variant: "destructive", title: "Error", description: "Please enter a valid email address" });
//       return false;
//     }
//     if (!editingUser && formData.password.length < 6) {
//       setError("Password must be at least 6 characters long");
//       toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters long" });
//       return false;
//     }
//     return true;
//   };

//   const handleAddUser = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const payload = {
//         name: formData.name,
//         email: formData.email,
//         password: formData.password,
//         mobile: formData.phone || "",
//         role: formData.role === "super-admin" ? "superadmin" : "subadmin",
//         status: formData.status === "inactive" ? "inActive" : "active",
//         avatar: "",
//       };

//       const response = await fetch(`${BaseUrl}/admin/update-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.message || "Failed to add user");
//       }

//       const data = await response.json();
//       toast({ title: "Success", description: data.message || "User added successfully" });
//       setIsAddDialogOpen(false);
//       resetForm();
//       fetchUsers();
//     } catch (err: any) {
//       setError(err.message || "Failed to add user");
//       toast({ variant: "destructive", title: "Error", description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditUser = async () => {
//     if (!validateForm() || !editingUser) return;

//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const payload = {
//         id: editingUser.id,
//         name: formData.name,
//         email: formData.email,
//         password: formData.password || undefined,
//         mobile: formData.phone || "",
//         role: formData.role === "super-admin" ? "superadmin" : "subadmin",
//         status: formData.status === "inactive" ? "inActive" : "active",
//         avatar: "",
//       };

//       const response = await fetch(`${BaseUrl}/admin/update-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.message || "Failed to update user");
//       }

//       const data = await response.json();
//       toast({ title: "Success", description: data.message || "User updated successfully" });
//       setIsEditDialogOpen(false);
//       setEditingUser(null);
//       resetForm();
//       fetchUsers();
//     } catch (err: any) {
//       setError(err.message || "Failed to update user");
//       toast({ variant: "destructive", title: "Error", description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (user?.id === userId) {
//       setError("You cannot delete your own account");
//       toast({ variant: "destructive", title: "Error", description: "You cannot delete your own account" });
//       return;
//     }
//     if (!window.confirm("Are you sure you want to delete this user?")) return;

//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const response = await fetch(`${BaseUrl}/admin/delete-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//         body: JSON.stringify({ id: userId }),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.message || "Failed to delete user");
//       }

//       const data = await response.json();
//       toast({ title: "Success", description: data.message || "User deleted successfully" });
//       fetchUsers();
//     } catch (err: any) {
//       setError(err.message || "Failed to delete user");
//       toast({ variant: "destructive", title: "Error", description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusUpdate = async (userId: string, status: "active" | "inactive") => {
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("adminToken");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const response = await fetch(`${BaseUrl}/admin/update-admin-status`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//         body: JSON.stringify({ id: userId, status: status === "inactive" ? "inActive" : "active" }),
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.message || "Failed to update status");
//       }

//       const data = await response.json();
//       toast({ title: "Success", description: data.message || "Status updated successfully" });
//       fetchUsers();
//     } catch (err: any) {
//       setError(err.message || "Failed to update status");
//       toast({ variant: "destructive", title: "Error", description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openEditDialog = (user: User) => {
//     setEditingUser(user);
//     setFormData({
//       name: user.name,
//       email: user.email,
//       password: "",
//       role: user.role,
//       status: user.status,
//       phone: user.phone,
//     });
//     setIsEditDialogOpen(true);
//     setError("");
//   };

//   const openAddDialog = () => {
//     resetForm();
//     setIsAddDialogOpen(true);
//   };

//   return (
//     <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
//             User Management
//           </h1>
//           <p className="text-sm sm:text-base text-gray-600">
//             Manage super-admin and sub-admin accounts
//           </p>
//         </div>
//         <Button
//           onClick={openAddDialog}
//           className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
//           disabled={loading}
//         >
//           <Plus className="h-4 w-4 mr-2" />
//           Add User
//         </Button>
//       </div>

//       <Card className="border-0 shadow-md">
//         <CardContent className="p-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <Input
//                   placeholder="Search users..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                   disabled={loading}
//                 />
//               </div>
//             </div>
//             <Select
//               value={selectedRole}
//               onValueChange={setSelectedRole}
//               disabled={loading}
//             >
//               <SelectTrigger className="w-full sm:w-[200px]">
//                 <SelectValue placeholder="Filter by role" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Roles</SelectItem>
//                 <SelectItem value="super-admin">Super Admin</SelectItem>
//                 <SelectItem value="sub-admin">Sub Admin</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {error && (
//         <Alert variant="destructive">
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <Card className="border-0 shadow-md">
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-b border-gray-200">
//                   <TableHead className="font-semibold text-gray-900 min-w-[200px]">
//                     User
//                   </TableHead>
//                   <TableHead className="font-semibold text-gray-900 hidden sm:table-cell">
//                     Role
//                   </TableHead>
//                   <TableHead className="font-semibold text-gray-900 hidden md:table-cell">
//                     Status
//                   </TableHead>
//                   <TableHead className="font-semibold text-gray-900 hidden lg:table-cell">
//                     Join Date
//                   </TableHead>
//                   <TableHead className="font-semibold text-gray-900 text-right">
//                     Actions
//                   </TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {users.map((user) => (
//                   <TableRow key={user.id} className="border-b border-gray-100">
//                     <TableCell className="py-3">
//                       <div className="flex items-center space-x-2 sm:space-x-3">
//                         <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
//                           <span className="text-xs sm:text-sm font-medium text-white">
//                             {user.name
//                               .split(" ")
//                               .map((n) => n[0])
//                               .join("")}
//                           </span>
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
//                             {user.name}
//                           </p>
//                           <div className="flex items-center text-xs sm:text-sm text-gray-500">
//                             <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
//                             <span className="truncate">{user.email}</span>
//                           </div>
//                           {user.phone && (
//                             <div className="flex items-center text-xs sm:text-sm text-gray-500">
//                               <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
//                               <span className="truncate">{user.phone}</span>
//                             </div>
//                           )}
//                           <div className="flex items-center space-x-2 mt-1 sm:hidden">
//                             <Badge
//                               variant="outline"
//                               className="bg-gray-50 text-xs"
//                             >
//                               {user.role === "super-admin" ? "Super Admin" : "Sub Admin"}
//                             </Badge>
//                             <Badge
//                               variant={
//                                 user.status === "active"
//                                   ? "default"
//                                   : "secondary"
//                               }
//                               className={`text-xs ${
//                                 user.status === "active"
//                                   ? "bg-green-100 text-green-800"
//                                   : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {user.status}
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell className="hidden sm:table-cell">
//                       <Badge variant="outline" className="bg-gray-50">
//                         {user.role === "super-admin" ? "Super Admin" : "Sub Admin"}
//                       </Badge>
//                     </TableCell>
//                     <TableCell className="hidden md:table-cell">
//                       <div className="flex items-center space-x-2">
//                         {user.status === "active" ? (
//                           <UserCheck className="h-4 w-4 text-green-600" />
//                         ) : (
//                           <UserX className="h-4 w-4 text-red-600" />
//                         )}
//                         <Select
//                           value={user.status}
//                           onValueChange={(value: "active" | "inactive") =>
//                             handleStatusUpdate(user.id, value)
//                           }
//                           disabled={loading || user.id === user?.id}
//                         >
//                           <SelectTrigger
//                             className={`w-[100px] ${
//                               user.status === "active"
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-red-100 text-red-800"
//                             }`}
//                           >
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="active">Active</SelectItem>
//                             <SelectItem value="inactive">Inactive</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </TableCell>
//                     <TableCell className="text-gray-600 hidden lg:table-cell">
//                       {new Date(user.joinDate).toLocaleDateString()}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex items-center justify-end space-x-1 sm:space-x-2">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => openEditDialog(user)}
//                           className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
//                           disabled={loading}
//                         >
//                           <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
//                           disabled={loading || user.id === user?.id}
//                         >
//                           <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//           <div className="flex justify-between items-center p-4">
//             <Button
//               onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
//               disabled={pagination.page === 1 || loading}
//               className="bg-blue-600 hover:bg-blue-700"
//             >
//               Previous
//             </Button>
//             <span>
//               Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
//             </span>
//             <Button
//               onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
//               disabled={pagination.page === pagination.totalPages || loading}
//               className="bg-blue-600 hover:bg-blue-700"
//             >
//               Next
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//         <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Add New User</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}
//             <div className="space-y-2">
//               <Label htmlFor="name">Name *</Label>
//               <Input
//                 id="name"
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 placeholder="Enter full name"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="email">Email *</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 placeholder="Enter email address"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password *</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 value={formData.password}
//                 onChange={(e) =>
//                   setFormData({ ...formData, password: e.target.value })
//                 }
//                 // cracked: "Enter new password"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="phone">Phone</Label>
//               <Input
//                 id="phone"
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({ ...formData, phone: e.target.value })
//                 }
//                 placeholder="Enter phone number"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="role">Role *</Label>
//               <Select
//                 value={formData.role}
//                 onValueChange={(value) =>
//                   setFormData({ ...formData, role: value })
//                 }
//                 disabled={loading}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select a role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="super-admin">Super Admin</SelectItem>
//                   <SelectItem value="sub-admin">Sub Admin</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="status">Status</Label>
//               <Select
//                 value={formData.status}
//                 onValueChange={(value: "active" | "inactive") =>
//                   setFormData({ ...formData, status: value })
//                 }
//                 disabled={loading}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex justify-end space-x-2 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => setIsAddDialogOpen(false)}
//                 disabled={loading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleAddUser}
//                 className="bg-blue-600 hover:bg-blue-700"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
//                     Adding...
//                   </div>
//                 ) : (
//                   "Add User"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//         <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Edit User</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             {error && (
//               <Alert variant="destructive">
//                 <AlertDescription>{error}</AlertDescription>
//               </Alert>
//             )}
//             <div className="space-y-2">
//               <Label htmlFor="edit-name">Name *</Label>
//               <Input
//                 id="edit-name"
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 placeholder="Enter full name"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-email">Email *</Label>
//               <Input
//                 id="edit-email"
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 placeholder="Enter email address"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-password">Password (optional)</Label>
//               <Input
//                 id="edit-password"
//                 type="password"
//                 value={formData.password}
//                 onChange={(e) =>
//                   setFormData({ ...formData, password: e.target.value })
//                 }
//                 placeholder="Enter new password (leave blank to keep current)"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-phone">Phone</Label>
//               <Input
//                 id="edit-phone"
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({ ...formData, phone: e.target.value })
//                 }
//                 placeholder="Enter phone number"
//                 disabled={loading}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-role">Role *</Label>
//               <Select
//                 value={formData.role}
//                 onValueChange={(value) =>
//                   setFormData({ ...formData, role: value })
//                 }
//                 disabled={loading}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select a role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="super-admin">Super Admin</SelectItem>
//                   <SelectItem value="sub-admin">Sub Admin</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="edit-status">Status</Label>
//               <Select
//                 value={formData.status}
//                 onValueChange={(value: "active" | "inactive") =>
//                   setFormData({ ...formData, status: value })
//                 }
//                 disabled={loading}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="flex justify-end space-x-2 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={() => setIsEditDialogOpen(false)}
//                 disabled={loading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleEditUser}
//                 className="bg-blue-600 hover:bg-blue-700"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
//                     Saving...
//                   </div>
//                 ) : (
//                   "Save Changes"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default UserManagement;