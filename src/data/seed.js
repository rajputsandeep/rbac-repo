// // Static in-memory data for prototype. Replace with Postgres later.
// export const superCompany = [
//   {
//     id: 'superCompany',
//     accountName: 'superCompany',
//     creationDate: '2024-01-10',
//     regAddress: 'Reg Address, Thane',
//     officialEmail: 'ops@synthora.example.com',
//     officialContactNumber: '+91-80-0000-0001',
//     email:'superadmin@superCompany.com',
//     password:'Password@123',
//     contacts: [
//       { contactType: 'Primary', contactDetails: '+91-98XXXXXX01', contactName: 'A. Kumar', contactDesignation: 'Ops Head' },
//       { contactType: 'Billing', contactDetails: 'billing@superCompany.example.com', contactName: 'Finance', contactDesignation: 'Accounts' },
//     ]
//   },
// ];

// export const Tenants = [
//   {
//     id: '1mg',
//     accountName: '1MG',
//     creationDate: '2024-01-10',
//     regAddress: 'Reg Address, Bengaluru',
//     officialEmail: 'ops@1mg.example.com',
//     officialContactNumber: '+91-80-0000-0001',
//     email:'tenant@1mg.com',
//     password:'Password@123',
//     contacts: [
//       { contactType: 'Primary', contactDetails: '+91-98XXXXXX01', contactName: 'A. Kumar', contactDesignation: 'Ops Head' },
//       { contactType: 'Billing', contactDetails: 'billing@1mg.example.com', contactName: 'Finance', contactDesignation: 'Accounts' },
//     ]
//   },
//   {
//     id: 'apollo',
//     accountName: 'Apollo',
//     creationDate: '2024-02-15',
//     regAddress: 'Hyderabad, India',
//     officialEmail: 'admin@apollo.example.com',
//     officialContactNumber: '+91-40-0000-0002',
//        email:'tenant@apollo.com',
//     password:'Password@123',
//     contacts: []
//   }
// ];

// export const Roles = [
//   { id: 'superadmin', name: 'superAdmin', creationDate: '2024-01-01', createdBy: '' },
//   { id: 'tenant', name: 'tenant', creationDate: '2024-01-01', createdBy: 'superAdmin' },
//   { id: 'admin', name: 'Admin', creationDate: '2024-01-01', createdBy: 'system' },
//   { id: 'agent', name: 'Agent', creationDate: '2024-01-01', createdBy: 'system' },
//   { id: 'auditor', name: 'Auditor', creationDate: '2024-01-01', createdBy: 'system' },
//   { id: 'reviewer', name: 'Reviewer', creationDate: '2024-01-01', createdBy: 'system' },
// ];

// // Permissions (very simple: map role -> permissions)
// export const Permissions = [
//   { roleId: 'admin', access: 'Call', enabled: 1 },
//   { roleId: 'agent', access: 'Call', enabled: 1 },
//   { roleId: 'auditor', access: 'Call', enabled: 0 },
//   { roleId: 'reviewer', access: 'Call', enabled: 0 },
// ];

// // Users (plain-text passwords for prototype). Use bcrypt hashes when you add Postgres.
// export const Users = [
//   {
//     userId: 'u-admin-1',
//     password: 'Password@123',
//     userName: 'Sandeep Admin',
//     contactDetails: '+91-9XXXXXXX11',
//     contactEmail: 'admin@1mg.example.com',
//     creationDate: '2024-03-01',
//     createdBy: 'system',
//     enabled: true,
//     roleId: 'admin',
//     role: 'Admin',
//     tenantId: '1mg',
//     email: 'admin@1mg.example.com'
//   },
//   {
//     userId: 'u-agent-1',
//     password: 'Agent@123',
//     userName: 'Anita Agent',
//     contactDetails: '+91-9XXXXXXX12',
//     contactEmail: 'agent@1mg.example.com',
//     creationDate: '2024-03-02',
//     createdBy: 'system',
//     enabled: true,
//     roleId: 'agent',
//     role: 'Agent',
//     tenantId: '1mg',
//     email: 'agent@1mg.example.com'
//   },
//   {
//     userId: 'u-auditor-1',
//     password: 'Auditor@123',
//     userName: 'Arun Auditor',
//     contactDetails: '+91-9XXXXXXX13',
//     contactEmail: 'auditor@apollo.example.com',
//     creationDate: '2024-03-03',
//     createdBy: 'system',
//     enabled: true,
//     roleId: 'auditor',
//     role: 'Auditor',
//     tenantId: 'apollo',
//     email: 'auditor@apollo.example.com'
//   }
// ];
