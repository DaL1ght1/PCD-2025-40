export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  address?: Address
  role: string[];
  enabled: boolean
  createdAt?: string
}

export interface Address {
  street?: string
  city?: string
  zipCode?: string
}


