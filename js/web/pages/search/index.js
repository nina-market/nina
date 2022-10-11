import dynamic from "next/dynamic";
import NinaSdk from '@nina-protocol/js-sdk'


const Search = dynamic(() => import('../../components/Search'))

const SearchPage = (props) => {
  const {searchQuery, searchResults} = props

    return (
        <Search searchQuery={searchQuery} searchResults={searchResults}/>
    )
}


  
  export const getServerSideProps = async ({query}) => {
    const searchQuery = query.q

    if (searchQuery) {
      try {
        if (!NinaSdk.client.provider) {
          NinaSdk.client.init(
            process.env.NINA_API_ENDPOINT,
            process.env.SOLANA_CLUSTER_URL,
            process.env.NINA_PROGRAM_ID
          )
        }
   
        const searchResults = await NinaSdk.Search.withQuery(searchQuery)
    
        return {
          props: {
            searchQuery: query,
            searchResults: searchResults,

          },
        }
      } catch (error) {
        console.warn(error)
      }

    }
    return {
      props:{}
    }
  }

export default SearchPage;