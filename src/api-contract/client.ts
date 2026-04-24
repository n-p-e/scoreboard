import { apiContract } from "~/api-contract/contract"
import { createClient } from "./contract-dsl"

const appApiClient = createClient({ contract: apiContract, baseUrl: "/" })

export { appApiClient }
