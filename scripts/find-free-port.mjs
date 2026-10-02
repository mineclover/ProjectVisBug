import net from 'node:net'

const requestedPort = Number(process.argv[2] || process.env.PLAYWRIGHT_PORT || process.env.TEST_PORT || 3000)
const maxAttempts = Number(process.env.PORT_SEARCH_LIMIT || 50)

if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
  throw new Error(`Invalid starting port: ${requestedPort}`)
}

const isHostPortAvailable = (port, host) =>
  new Promise(resolve => {
    const socket = net.createConnection({ port, host })
    const finish = available => {
      socket.destroy()
      resolve(available)
    }
    socket.once('connect', () => finish(false))
    socket.once('error', error => {
      // ECONNREFUSED means no listener on this address. Other local address
      // errors (for example, IPv6 disabled) also mean this probe is clear.
      finish(error.code === 'ECONNREFUSED' || error.code === 'EADDRNOTAVAIL')
    })
    socket.setTimeout(150, () => finish(true))
  })

// Probe loopback in both address families so wildcard listeners are detected
// regardless of which family they bind.
const isPortAvailable = async port =>
  (await isHostPortAvailable(port, '127.0.0.1')) &&
  (await isHostPortAvailable(port, '::1'))

for (let offset = 0; offset < maxAttempts; offset += 1) {
  const port = requestedPort + offset
  if (port > 65535) break
  if (await isPortAvailable(port)) {
    process.stdout.write(`${port}\n`)
    process.exit(0)
  }
}

throw new Error(`No available port found from ${requestedPort} after ${maxAttempts} attempts`)
