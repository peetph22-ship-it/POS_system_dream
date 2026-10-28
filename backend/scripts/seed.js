// Seeds an owner account and a small demo menu/floor plan for development.
// Safe to re-run: each part is skipped when data already exists.
const crypto = require('node:crypto')

const bcrypt = require('bcrypt')

const pool = require('../app/config/db')

const demoMenu = [
  {
    category: 'อาหารจานเดียว',
    station: 'ครัว',
    items: [
      ['ข้าวกะเพราหมูสับ', 60],
      ['ข้าวผัดกุ้ง', 70],
      ['ผัดไทยกุ้งสด', 80]
    ]
  },
  {
    category: 'เครื่องดื่ม',
    station: 'บาร์',
    items: [
      ['ชาไทยเย็น', 45],
      ['กาแฟเย็น', 50],
      ['น้ำเปล่า', 15]
    ]
  }
]

async function seedOwner(client) {
  const { rows } = await client.query(
    "SELECT 1 FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'owner' LIMIT 1"
  )
  if (rows.length > 0) {
    console.log('Owner account exists, skipping')
    return
  }

  const pin = process.env.SEED_OWNER_PIN || crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  if (!/^[0-9]{4,6}$/.test(pin)) {
    throw new Error('SEED_OWNER_PIN must be 4-6 digits')
  }

  await client.query(
    `INSERT INTO users (role_id, display_name, pin_hash)
     SELECT id, 'Owner', $1 FROM roles WHERE code = 'owner'`,
    [await bcrypt.hash(pin, 12)]
  )
  console.log(
    process.env.SEED_OWNER_PIN
      ? 'Created owner account with SEED_OWNER_PIN'
      : `Created owner account with generated PIN ${pin} (shown once; change it after signing in)`
  )
}

async function seedDemoData(client) {
  const { rows } = await client.query('SELECT 1 FROM categories LIMIT 1')
  if (rows.length > 0) {
    console.log('Menu data exists, skipping demo menu and tables')
    return
  }

  const stationIds = {}
  for (const [name, type] of [['ครัว', 'kitchen'], ['บาร์', 'bar']]) {
    const result = await client.query(
      'INSERT INTO stations (name, station_type) VALUES ($1, $2) RETURNING id',
      [name, type]
    )
    stationIds[name] = result.rows[0].id
  }

  for (const [categoryIndex, group] of demoMenu.entries()) {
    const category = await client.query(
      'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING id',
      [group.category, categoryIndex]
    )
    for (const [itemIndex, [name, price]] of group.items.entries()) {
      await client.query(
        `INSERT INTO menu_items (category_id, station_id, name, price, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [category.rows[0].id, stationIds[group.station], name, price, itemIndex]
      )
    }
  }

  const sweetness = await client.query(
    "INSERT INTO modifier_groups (name, min_select, max_select) VALUES ('ระดับความหวาน', 1, 1) RETURNING id"
  )
  const groupId = sweetness.rows[0].id
  for (const [index, name] of ['หวานปกติ', 'หวานน้อย', 'ไม่หวาน'].entries()) {
    await client.query(
      'INSERT INTO modifiers (group_id, name, sort_order) VALUES ($1, $2, $3)',
      [groupId, name, index]
    )
  }
  await client.query(
    `INSERT INTO menu_item_modifier_groups (menu_item_id, group_id)
     SELECT id, $1 FROM menu_items WHERE name IN ('ชาไทยเย็น', 'กาแฟเย็น')`,
    [groupId]
  )

  const zone = await client.query("INSERT INTO zones (name) VALUES ('ในร้าน') RETURNING id")
  for (let number = 1; number <= 8; number += 1) {
    await client.query(
      'INSERT INTO dining_tables (zone_id, name, sort_order) VALUES ($1, $2, $3)',
      [zone.rows[0].id, `T${number}`, number]
    )
  }

  console.log('Created demo stations, menu, modifiers and 8 tables')
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await seedOwner(client)
    await seedDemoData(client)
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
