import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { finalize } from "rxjs/operators";

import { User } from "../../../core/models/user.model";
import { NotificationService } from "../../../core/services/notification.service";
import { UserDialogComponent } from "../user-dialog/user-dialog.component";
import { ConfirmDialogComponent } from "../../../shared/components/confirm-dialog/confirm-dialog.component";
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: "app-user-management",
  templateUrl: "./user-management.component.html",
  styleUrls: ["./user-management.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, MatTooltipModule, MatDialogModule],
})
export class UserManagementComponent implements OnInit, OnDestroy {
  Math = Math;

  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];

  searchQuery = "";
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  isLoading = false;
  isProcessing = false;

  private subscriptions = new Subscription();

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadUsers(): void {
    this.isLoading = true;

    const sub = this.adminService
      .getAllUsers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilter();
          this.notificationService.success('Users loaded successfully');
        },
        error: (error) => {
          console.error("Error loading users:", error);
          this.notificationService.error('Failed to load users');
        },
      });

    this.subscriptions.add(sub);
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(
        (user) =>
          user.firstname.toLowerCase().includes(query) ||
          user.lastname.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          this.formatRole(user.role[0]).toLowerCase().includes(query),
      );
    }

    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedUsers();
    this.cdr.detectChanges();
  }

  updatePaginatedUsers(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  onPageSizeChange(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedUsers();
  }

  goToFirstPage(): void {
    this.currentPage = 1;
    this.updatePaginatedUsers();
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
    this.updatePaginatedUsers();
  }

  formatRole(role: string): string {
    if (!role) return "User";
    const formattedRole = role.replace("ROLE_", "");
    return formattedRole.charAt(0).toUpperCase() + formattedRole.slice(1).toLowerCase();
  }

  openAddUserModal(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: "600px",
      data: { isEdit: false },
      panelClass: "custom-dialog-container",
      disableClose: true,
    });

    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isProcessing = true;

        const userData = {
          firstname: result.firstname,
          lastname: result.lastname,
          email: result.email,
          role: result.role,
          active: result.active,
          password: result.password || undefined,
          address: result.address || undefined
        };

        this.adminService
          .createUser(userData)
          .pipe(finalize(() => (this.isProcessing = false)))
          .subscribe({
            next: (newUser) => {
              this.users.push(newUser);
              this.applyFilter();
              this.notificationService.success('User created successfully');
            },
            error: (error) => {
              console.error("Error creating user:", error);
            },
          });
      }
    });

    this.subscriptions.add(sub);
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: "600px",
      data: {
        user: { ...user, password: '' },
        isEdit: true,
      },
      panelClass: "custom-dialog-container",
      disableClose: true,
    });

    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isProcessing = true;

        const updatePayload = {
          firstname: result.firstname,
          lastname: result.lastname,
          email: result.email,
          role: result.role,
          active: result.active,
          password: result.password || undefined,
          address: result.address || undefined
        };

        this.adminService
          .updateUser(user.id, updatePayload)
          .pipe(finalize(() => (this.isProcessing = false)))
          .subscribe({
            next: (updatedUser) => {
              if (updatedUser) {
                const index = this.users.findIndex((u) => u.id === user.id);
                if (index !== -1) {
                  this.users[index] = updatedUser;
                  this.applyFilter();
                  this.cdr.detectChanges();
                }
                this.notificationService.success('User updated successfully');
              }
            },
            error: (error) => {
              console.error("Error updating user:", error);
            },
          });
      }
    });

    this.subscriptions.add(sub);
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Delete User",
        message: "Are you sure you want to delete this user?",
        detail: `${user.firstname} ${user.lastname} (${user.email})`,
        confirmText: "Delete",
        cancelText: "Cancel",
        confirmClass: "btn-danger",
      },
      panelClass: "custom-dialog-container",
    });

    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isProcessing = true;

        this.adminService
          .deleteUser(user.id)
          .pipe(finalize(() => (this.isProcessing = false)))
          .subscribe({
            next: (success) => {
              if (success) {
                this.users = this.users.filter((u) => u.id !== user.id);
                this.applyFilter();
                this.cdr.detectChanges();
                this.notificationService.success('User deleted successfully');
              }
            },
            error: (error) => {
              console.error("Error deleting user:", error);
            },
          });
      }
    });

    this.subscriptions.add(sub);
  }

  selectedUsers: string[] = [];

  toggleUserSelection(userId: string, event: Event): void {
    event.stopPropagation();

    const index = this.selectedUsers.indexOf(userId);
    if (index === -1) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers.splice(index, 1);
    }
    this.cdr.detectChanges();
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.includes(userId);
  }

  selectAllUsers(): void {
    if (this.selectedUsers.length === this.paginatedUsers.length) {
      this.selectedUsers = [];
    } else {
      this.selectedUsers = this.paginatedUsers.map((user) => user.id);
    }
    this.cdr.detectChanges();
  }

  bulkDeleteUsers(): void {
    if (this.selectedUsers.length === 0) {
      this.notificationService.warning('No users selected');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Users",
        message: `Are you sure you want to delete ${this.selectedUsers.length} selected users?`,
        detail: "This action cannot be undone.",
        confirmText: "Delete All",
        cancelText: "Cancel",
        confirmClass: "btn-danger",
      },
      panelClass: "custom-dialog-container",
    });

    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isProcessing = true;

        this.adminService
          .bulkDeleteUsers(this.selectedUsers)
          .pipe(finalize(() => (this.isProcessing = false)))
          .subscribe({
            next: (success) => {
              if (success) {
                this.users = this.users.filter((u) => !this.selectedUsers.includes(u.id));
                this.selectedUsers = [];
                this.applyFilter();
                this.cdr.detectChanges();
                this.notificationService.success(`${this.selectedUsers.length} users deleted successfully`);
              }
            },
            error: (error) => {
              console.error("Error deleting users:", error);
            },
          });
      }
    });

    this.subscriptions.add(sub);
  }
}
