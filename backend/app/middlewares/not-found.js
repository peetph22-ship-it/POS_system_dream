function notFound(_req, res) {
  res.status(404).json({ message: 'Invalid Route' })
}

module.exports = notFound
