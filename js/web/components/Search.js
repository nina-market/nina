import NinaSdk from '@nina-protocol/nina-sdk'
import { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Box } from '@mui/system'
import { Typography } from '@mui/material'
import { useCallback } from 'react'
import { useAutocomplete } from '@mui/base/AutocompleteUnstyled'
import Dots from './Dots'
import Link from 'next/link'

const Search = () => {
  // const {
  //     getRootProps,
  //     getInputLabelProps,
  //     getInputProps,
  //     getListboxProps,
  //     getOptionProps,
  //     groupedOptions,
  // } = useAutocomplete({
  //     id: 'nina-search',
  //     options: [response],
  //     getOptionLabel: (option) => option
  // })

  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(undefined)
  const [suggestions, setSuggestions] = useState()
  const [fetchedResponse, setFetchedResponse] = useState(undefined)

  useEffect(() => {
    NinaSdk.client.init(
      process.env.NINA_API_ENDPOINT,
      process.env.SOLANA_CLUSTER_URL,
      process.env.NINA_PROGRAM_ID
    )
  }, [])

  const updateResponse = useCallback(
    (res) => {
      console.log('response', response)
    },
    [response]
  )

  // useEffect(() => {
  //   const handleSuggestions = async () => {
  //     const response =  await NinaSdk.Search.suggestQuery(query)
  //     console.log('response :>> ', response);
  //     setSuggestions(response)
  //   }
  //   if (query) {
  //     handleSuggestions()
  //   }
  //  console.log('suggestions :>> ', suggestions);
  // }, [query])

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFetchedResponse(false)

    if (e.target.value !== null || e.target.value !== '') {
      setQuery(e.target.value)
      await NinaSdk.Search.withQuery(query).then(setResponse)
      setFetchedResponse(true)
    }

    if (query === '') {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    setQuery('')
    updateResponse()
    console.log('query', query)
    console.log('response', response)
  }

  const changeHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setQuery(e.target.value)
    if (e.keyCody === 13) {
      setQuery('')
    }
  }
  return (
    <Box sx={{ height: '60vh', width: '960px' }}>
      <Form onSubmit={(e) => handleSubmit(e)}>
        <SearchInputWrapper>
          <TextField
            className="input"
            fullWidth
            onChange={(e) => changeHandler(e)}
            label="Search for anything..."
            id="fullWidth"
            variant="standard"
            value={query}
            autoComplete={'off'}
          />
        </SearchInputWrapper>
      </Form>
      <SearchResultsWrapper>
        <ResponsiveSearchResultContainer>
          {fetchedResponse === false && (
            <ResponsiveDotContainer>
              <Box sx={{ width: '100%', paddingTop: '25%', margin: 'auto' }}>
                <Dots />
              </Box>
            </ResponsiveDotContainer>
          )}
          {fetchedResponse === true &&
            response.artists.length === 0 &&
            response.releases.length === 0 &&
            response.hubs.length === 0 && (
              <>
                <Typography>No results found</Typography>
              </>
            )}
          {fetchedResponse && response.artists.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 'bold' }}>ARTISTS</Typography>
              {response?.artists.map((artist) => (
                <Link href={`/profiles/${artist.publicKey}`}>
                  <a>
                    <Typography>{artist.name}</Typography>
                  </a>
                </Link>
              ))}
            </>
          )}
        </ResponsiveSearchResultContainer>
        <ResponsiveSearchResultContainer>
          {fetchedResponse && response.releases.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 'bold' }}>RELEASES</Typography>
              {response?.releases.map((release) => (
                <Link href={`/${release.publicKey}`}>
                  <Typography>
                    {' '}
                    <a>{release.title} </a>
                  </Typography>
                </Link>
              ))}
            </>
          )}
        </ResponsiveSearchResultContainer>
        <ResponsiveSearchResultContainer>
          {fetchedResponse && response.hubs.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 'bold' }}>HUBS</Typography>
              {response?.hubs.map((hub) => (
                <Typography>{hub.displayName}</Typography>
              ))}
            </>
          )}
        </ResponsiveSearchResultContainer>
      </SearchResultsWrapper>
    </Box>
  )
}

const SearchInputWrapper = styled(Box)(({ theme }) => ({
  maxWidth: '960px',
}))
const Form = styled('form')(({ theme }) => ({}))
const SearchResultsWrapper = styled(Box)(({ theme }) => ({
  textAlign: 'left',
}))
const ResponsiveSearchResultContainer = styled(Box)(({ theme }) => ({
  maxHeight: '60vh',
  width: '960px',
  overflow: 'auto',
  webkitOverflowScrolling: 'touch',
  padding: '10px 0',
}))

const ResponsiveDotContainer = styled(Box)(({ theme }) => ({
  fontSize: '80px',
  display: 'flex',
  height: '100%',
  [theme.breakpoints.down('md')]: {
    fontSize: '30px',
    left: '47%',
    top: '53%',
  },
}))

export default Search
