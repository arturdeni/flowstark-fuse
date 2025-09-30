// src/app/(public)/sign-up/SignUpPage.tsx (versión modificada)
import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import FirebaseSignUpForm from '@auth/services/firebase/components/FirebaseSignUpForm';

/**
 * The sign up page.
 */
function SignUpPage() {
	return (
		<div className="flex min-w-0 flex-1 flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
			<Paper className="h-full w-full px-4 py-2 ltr:border-r-1 rtl:border-l-1 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none">
				<div className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<img
						className="w-12"
						src="/assets/images/logo/logo.svg"
						alt="logo"
					/>

					<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
						Regístrate
					</Typography>
					<div className="mt-0.5 flex items-baseline font-medium">
						<Typography>Ya tienes cuenta?</Typography>
						<Link
							className="ml-1"
							to="/sign-in"
						>
							Iniciar sesión
						</Link>
					</div>

					<FirebaseSignUpForm />
				</div>
			</Paper>

			<Box
				className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
				sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText' }}
			>
				{/* Mantener el resto del componente igual */}
				{/* SVG graphics code... */}
				<div className="relative z-10 w-full max-w-4xl">
					<div className="text-7xl font-bold leading-none text-gray-100">
						<div>Empieza gratis</div>
						<div>y haz que tu negocio fluya</div>
					</div>
					<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
						Con Flowstark gestionas cobros recurrentes, organizas tus clientes y mantienes todo en orden.
					</div>
					<div className="mt-8 flex items-center">
						<AvatarGroup
							sx={{
								'& .MuiAvatar-root': {
									borderColor: 'primary.main'
								}
							}}
						>
							<Avatar src="/assets/images/avatars/female-18.jpg" />
							<Avatar src="/assets/images/avatars/female-11.jpg" />
							<Avatar src="/assets/images/avatars/male-09.jpg" />
							<Avatar src="/assets/images/avatars/male-16.jpg" />
						</AvatarGroup>

						<div className="ml-4 font-medium tracking-tight text-gray-400">
							No estás solo, otros negocios ya trabajan con nosotros.
						</div>
					</div>
				</div>
			</Box>
		</div>
	);
}

export default SignUpPage;
