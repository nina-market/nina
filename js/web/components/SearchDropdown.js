import { Box, Typography } from '@mui/material'
import Link from 'next/link'
const SearchDropdown = ({ searchData, category, hasResults }) => {
  let rows

  if (category === 'artists') {
    rows = searchData?.artists?.map((data) => {
      const artistName = data?.name
      const artistLink = `/profiles/${data?.publicKey}`

      let formattedData = {
        name: artistName,
        link: artistLink,
      }

      return formattedData
    })
  }

  if (category === 'releases') {
    rows = searchData?.releases?.map((data) => {
      const releaseName = data?.title
      const releaseLink = `/${data?.publicKey}`

      let formattedData = {
        name: releaseName,
        link: releaseLink,
      }

      return formattedData
    })
  }

  if (category === 'hubs') {
    rows = searchData?.hubs?.map((data) => {
      const hubName = data?.displayName
      const hubLink = `/hubs/${data?.handle}`

      let formattedData = {
        name: hubName,
        link: hubLink,
      }

      return formattedData
    })
  }
  console.log('hasResults', hasResults)
  return (
    <>
      {hasResults === true && (
        <>
          <Typography sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            {category}
          </Typography>
          {rows?.map((row) => (
            <Link href={row?.link}>
              <a key={row?.name}>
                <Typography>{row?.name}</Typography>
              </a>
            </Link>
          ))}
        </>
      )}
    </>
  )
}

export default SearchDropdown
