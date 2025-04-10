import Typography from '@mui/material/Typography';
import Link from '@fuse/core/Link';
import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CardContent from '@mui/material/CardContent';
import { lighten } from '@mui/material/styles';
import FirebaseSignInTab from './tabs/FirebaseSignInTab';

/**
 * The sign in page.
 */
function SignInPage() {
	return (
		<div className="flex min-w-0 flex-1 flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
			<Paper className="h-full w-full px-4 py-2 ltr:border-r-1 rtl:border-l-1 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none">
				<CardContent className="mx-auto w-full max-w-80 sm:mx-0 sm:w-80">
					<img
						className="w-12"
						src="/assets/images/logo/logo.svg"
						alt="logo"
					/>

					<Typography className="mt-8 text-4xl font-extrabold leading-[1.25] tracking-tight">
						Sign in
					</Typography>
					<div className="mt-0.5 flex items-baseline font-medium">
						<Typography>Don't have an account?</Typography>
						<Link
							className="ml-1"
							to="/sign-up"
						>
							Sign up
						</Link>
					</div>

					<Box
						className="mt-6 text-md leading-[1.625] rounded-lg py-2 px-4"
						sx={{
							backgroundColor: (theme) => lighten(theme.palette.primary.main, 0.8),
							color: 'primary.dark'
						}}
					>
						Welcome to Flowstark. Sign in to access your account.
					</Box>

					{/* Firebase logo and authentication form */}
					<div className="mt-6 mb-8 flex items-center justify-center">
						<img
							className="h-9"
							src="/assets/images/logo/firebase.svg"
							alt="Firebase Authentication"
						/>
					</div>

					<FirebaseSignInTab />
				</CardContent>
			</Paper>

			{/* Mantener el resto del componente igual */}
			<Box
				className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
				sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText' }}
			>
				<svg
					className="pointer-events-none absolute inset-0"
					viewBox="0 0 960 540"
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMax slice"
					xmlns="http://www.w3.org/2000/svg"
				>
					<Box
						component="g"
						className="opacity-5"
						fill="none"
						stroke="currentColor"
						strokeWidth="100"
					>
						<circle
							r="234"
							cx="196"
							cy="23"
						/>
						<circle
							r="234"
							cx="790"
							cy="491"
						/>
					</Box>
				</svg>
				{/* Resto del SVG y elementos decorativos... */}

				<div className="relative z-10 w-full max-w-4xl">
					<div className="text-7xl font-bold leading-none text-gray-100">
						<div>Welcome to</div>
						<div>Flowstark</div>
					</div>
					<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
						Gestión integral de suscripciones para tu negocio
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
							Join our growing community of businesses
						</div>
					</div>
				</div>
			</Box>
		</div>
	);
}

export default SignInPage;
