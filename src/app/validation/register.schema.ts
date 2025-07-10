import * as yup from 'yup'
import { emailValidator, passwordValidator } from '@/app/validation/auth.schema'

export default yup.object({
  name: yup.string().required('name is required'),
  email: emailValidator,
  password: passwordValidator,
  role: yup.string().oneOf(['user', 'admin']).default('user')
})


