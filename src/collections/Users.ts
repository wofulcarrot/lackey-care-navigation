import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: { singular: 'Admin User', plural: 'Admin Users' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
    group: 'System',
    description: 'Accounts with access to this CMS. Admins can edit everything; Editors can update content (resources, symptoms, static text) but not triage logic.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
}

export default Users
