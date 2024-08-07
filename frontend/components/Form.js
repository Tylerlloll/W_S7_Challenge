import React, { useEffect, useState } from 'react'
import * as Yup from 'yup'
// 👇 Here are the validation errors you will use with Yup.
const validationErrors = {
  fullNameTooShort: 'full name must be at least 3 characters',
  fullNameTooLong: 'full name must be at most 20 characters',
  sizeIncorrect: 'size must be S or M or L'
}

// 👇 Here you will create your schema.
const schema = Yup.object().shape({
  fullName: Yup.string()
  .min(3, validationErrors.fullNameTooShort)
  .max(20, validationErrors.fullNameTooLong)
  .required('Full name is required'),
  size: Yup.string()
  .oneOf(['S', 'M', 'L'], validationErrors.sizeIncorrect)
  .required('Size is required'),
  toppings: Yup.array().of(Yup.string())
})

// 👇 This array could help you construct your checkboxes using .map in the JSX.
const toppings = [
  { topping_id: '1', text: 'Pepperoni' },
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' },
]

export default function Form() {
  const [formData, setFormData] = useState({
    fullName: '',
    size: '',
    toppings: []
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState({ success: '', failure: '' })

  const handleChange = (e) => {
    const { name, value } = e.target;
    const trimmedValue = name === 'fullName' ? value.trim() : value;
    setFormData({ ...formData, [name]: trimmedValue })
  }

  const handleToppingChange = (e) => {
    const { value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      toppings: checked
      ? [...prev.toppings, value]
      : prev.toppings.filter(t => t !==value)
    }))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setSubmitMessage({ success: '', failure: ''})

    try {
      await schema.validate(formData, { abortEarly: false })

      const orderData = {
        fullName: formData.fullName,
        size: formData.size,
        toppings: formData.toppings
      }

      const response = await fetch('http://localhost:9009/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit order')
      }

      const result = await response.json()
      console.log('Order submitted successfully:', result)

      const toppingCount = formData.toppings.length;
      const toppingsMessage = formData.toppings.length === 0
      ? 'no toppings'
      :`${toppingCount} topping${toppingCount > 1 ? 's' : ''}`;
      // : formData.toppings.map(id => toppings.find(t => t.topping_id === id).text).join(', ')

      const sizeMap = {
        'S': 'small',
        'M': 'medium',
        'L': 'large'
      }

      // const successMessage = `Thank you for your order, ${formData.fullName}! Your ${sizeMap[formData.size]} pizza with ${toppingsMessage} is on the way.`

      setSubmitMessage({ 
        success: [
          `Thank you for your order, ${formData.fullName}!`,
          `Your ${sizeMap[formData.size]} pizza`,
          `with ${toppingsMessage}`
        ].join(' ')
      });
      setFormData({
        fullName: '',
        size: '',
        toppings: []
      })
    } catch (err) {
      if (err.inner) {
        const validationErrors = {}
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message
        })
        setErrors(validationErrors)
      } else {
        console.error('Error submitting order:', err)
        setSubmitMessage({ failure: 'Something went wrong while submitting your order. Please try again.' })
      }
    }
    setIsSubmitting(false)
  }
  const isFormValid = formData.fullName.trim().length >= 3 && formData.fullName.trim().length <= 20 && ['S', 'M', 'L'].includes(formData.size)


  useEffect(() => {
    schema.validate(formData, { abortEarly: false })
    .then(() => setErrors({}))
    .catch(err => {
      const newErrors = {}
      err.inner.forEach(error => {
        newErrors[error.path] = error.message
      })
      setErrors(newErrors)
    })
  }, [formData])

  return (
    <form onSubmit={handleSubmit}>
      <h2>Order Your Pizza</h2>
      {submitMessage.success && <div className='success'>{submitMessage.success}</div>}
      {submitMessage.failure && <div className='failure'>{submitMessage.failure}</div>}

      <div className="input-group">
        <div>
          <label htmlFor="fullName">Full Name</label><br />
          <input 
          placeholder="Type full name"
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
        />
        </div>
        {errors.fullName && <div className='error'>{errors.fullName}</div>}
      </div>

      <div className="input-group">
        <div>
          <label htmlFor="size">Size</label><br />
          <select id="size" name="size" value={formData.size} onChange={handleChange}>
            <option value="">----Choose Size----</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
        {errors.size && <div className='error'>{errors.size}</div>}
      </div>

      <div className="input-group">
        {toppings.map(({ topping_id, text }) => (
        <label key={topping_id}>
          <input
            name={text}
            type="checkbox"
            value={topping_id}
            checked={formData.toppings.includes(topping_id)}
            onChange={handleToppingChange}
          />
          {text}<br />
        </label>
        ))}
      </div>

      <input type="submit" disabled={!isFormValid || isSubmitting} />
    </form>
  )
}
