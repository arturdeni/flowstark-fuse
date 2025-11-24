import { Controller, useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import _ from 'lodash';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import firebase from 'firebase/compat/app';
import useFirebaseAuth from '../useFirebaseAuth';
import { FirebaseSignUpPayload } from '../FirebaseAuthProvider';
/**
 * Form Validation Schema
 */
const schema = z
	.object({
		email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
		password: z
			.string()
			.nonempty('Please enter your password.')
			.min(8, 'Password is too short - should be 8 chars minimum.'),
		passwordConfirm: z.string().nonempty('Password confirmation is required'),
		acceptTermsConditions: z.boolean().refine((val) => val === true, 'The terms and conditions must be accepted.')
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords must match',
		path: ['passwordConfirm']
	});

const defaultValues = {
	email: '',
	password: '',
	passwordConfirm: '',
	acceptTermsConditions: false
};

function FirebaseSignUpForm() {
	const { signUp } = useFirebaseAuth();

	const { control, formState, handleSubmit, setError } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	function onSubmit(formData: FirebaseSignUpPayload) {
		const { email, password } = formData;
		signUp({
			email,
			password
		})
			.then((_res) => {
				// No need to do anything, registered user data will be set at app/auth/AuthRouteProvider
			})
			.catch((_error) => {
				const error = _error as firebase.auth.Error;

				const emailErrorCodes = ['auth/email-already-in-use', 'auth/invalid-email'];

				const passwordErrorCodes = ['auth/weak-password', 'auth/wrong-password'];

				const errors: {
					type: 'email' | 'password' | `root.${string}` | 'root';
					message: string;
				}[] = [];

				if (emailErrorCodes.includes(error.code)) {
					errors.push({
						type: 'email',
						message: error.message
					});
				}

				if (passwordErrorCodes.includes(error.code)) {
					errors.push({
						type: 'password',
						message: error.message
					});
				}

				errors.forEach((err) => {
					setError(err.type, {
						type: 'manual',
						message: err.message
					});
				});
			});
	}

	return (
		<form
			name="registerForm"
			noValidate
			className="mt-8 flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Contraseña"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="passwordConfirm"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Confirmar Contraseña"
						type="password"
						error={!!errors.passwordConfirm}
						helperText={errors?.passwordConfirm?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="acceptTermsConditions"
				control={control}
				render={({ field }) => (
					<FormControl error={!!errors.acceptTermsConditions}>
						<FormControlLabel
							label={
								<span>
									Acepto los{' '}
									<a
										href="https://www.flowstark.com/terminos-y-condiciones"
										target="_blank"
										rel="noopener noreferrer"
									>
										Términos y Condiciones
									</a>{' '}
									y la{' '}
									<a
										href="https://www.flowstark.com/politica-de-privacidad"
										target="_blank"
										rel="noopener noreferrer"
									>
										Política de Privacidad
									</a>
								</span>
							}
							control={
								<Checkbox
									size="small"
									color="primary"
									{...field}
								/>
							}
						/>
						<FormHelperText>{errors?.acceptTermsConditions?.message}</FormHelperText>
					</FormControl>
				)}
			/>

			<Button
				variant="contained"
				color="primary"
				className="mt-6 w-full"
				aria-label="Register"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
				sx={{
					'&:hover': {
						backgroundColor: '#2C645E'
					}
				}}
			>
				Empezar
			</Button>
		</form>
	);
}

export default FirebaseSignUpForm;
