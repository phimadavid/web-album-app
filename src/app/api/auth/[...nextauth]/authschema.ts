import * as yup from 'yup'

// According to the blog post of abstractapi, using string.email() "Yup library makes a few validation errors"
// https://www.abstractapi.com/guides/yup-email-validation-string-schema-code-examples
// Yup accepts the following emails as valid:
// 'eric.cartman@e.c'
// 'eric.cartman@southpark.com..au'
// use the yup.string.matches() method instead of the yup.string.email() method

export const emailValidator = yup
  .string()
  .required('Email is required')
  .matches(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, {
    message: 'Invalid email',
  })

export const passwordValidator = yup
  .string()
  .required('Password is required')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, one symbol (#, $, !, %, *, ?, &, or any combination), and have a minimum length of 6 characters'
  )

export default yup.object({
  email: emailValidator,
  password: passwordValidator,
})
