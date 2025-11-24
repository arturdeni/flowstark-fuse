import { useTimeout } from '@fuse/hooks';
import { useState } from 'react';
import clsx from 'clsx';
import Box from '@mui/material/Box';

export type FuseLoadingProps = {
	delay?: number;
	className?: string;
};

/**
 * FuseLoading displays a loading state with an optional delay
 */
function FuseLoading(props: FuseLoadingProps) {
	const { delay = 0, className } = props;
	const [showLoading, setShowLoading] = useState(!delay);

	useTimeout(() => {
		setShowLoading(true);
	}, delay);

	return (
		<Box
			className={clsx(
				className,
				'flex flex-1 min-h-full h-full w-full self-center flex-col items-center justify-center p-6',
				!showLoading ? 'hidden' : ''
			)}
			sx={{
				backgroundColor: 'background.default'
			}}
		>
			<Box
				id="spinner"
				sx={{
					'& > div': {
						backgroundColor: 'primary.dark'
					}
				}}
			>
				<div className="bounce1" />
				<div className="bounce2" />
				<div className="bounce3" />
			</Box>
		</Box>
	);
}

export default FuseLoading;
