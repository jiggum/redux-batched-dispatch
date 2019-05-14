export default function mockFetch({ response, error, delay = 0 }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (error) {
        reject(error)
      } else {
        resolve(response)
      }
    }, delay)
  })
}
