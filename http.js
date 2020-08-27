import axios from 'axios'

export default async (url, method, data) => {
    const requestData = await axios({
        url,
        method,
        data,
    })

    if (requestData.data.error) {
    throw new Error(requestData.data.error)
    }
    return requestData.data
}