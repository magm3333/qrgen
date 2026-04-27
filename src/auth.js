let users = new Map()

async function loadUsers() {
  if (users.size > 0) return
  try {
    const basePath = '/qrgen/'
    const response = await fetch(basePath + 'passwords')
    if (!response.ok) throw new Error('Failed to load')
    const text = await response.text()
    text.trim().split('\n').forEach(line => {
      const [user, hash] = line.trim().split(':')
      if (user && hash) {
        users.set(user.toLowerCase(), hash.trim().toLowerCase())
      }
    })
  } catch (e) {
    console.error('Error loading passwords:', e.message)
    // Fallback users
    users.set('magm', 'dd65ccba92605e2a460d385f651bbb85c193f70b3ee556501a3692af06a48171')
    users.set('admin', '12331e7c047571e923cdce4c79cacf51e6e2d7ed98722c3ef60ce95c7039c179')
  }
}

export async function getUsers() {
  await loadUsers()
  return Array.from(users.keys())
}

export async function validatePassword(username, password) {
  if (!username || !password) return false
  await loadUsers()
  const expectedHash = users.get(username.toLowerCase())
  if (!expectedHash) return false
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return actualHash === expectedHash
}