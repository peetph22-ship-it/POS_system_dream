export interface NavItem {
  title: string
  icon: string
  to: string
}

export const navItems: NavItem[] = [
  { title: 'หน้าหลัก', icon: 'mdi-home-outline', to: '/' },
  { title: 'ขายหน้าร้าน', icon: 'mdi-cash-register', to: '/pos' },
  { title: 'โต๊ะ', icon: 'mdi-table-furniture', to: '/tables' },
  { title: 'ครัว', icon: 'mdi-chef-hat', to: '/kitchen' },
  { title: 'ตั้งค่า', icon: 'mdi-cog-outline', to: '/settings' }
]
