import { BackendErrors } from "./backendErrors"
import { CurrentUser } from "./currentUser"

export interface AuthState {
    isSubmitting:boolean
    currentUser: CurrentUser | null | undefined
    isLoading:boolean
    validationErrors:BackendErrors | null
}