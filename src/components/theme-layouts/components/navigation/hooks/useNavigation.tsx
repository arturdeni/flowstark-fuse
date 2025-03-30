import { useAppSelector } from 'src/store/hooks';
import { useMemo } from 'react';
import useUser from '@auth/useUser';
import FuseUtils from '@fuse/utils';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import { selectNavigationAll } from '../store/navigationSlice';

function useNavigation() {
	const { data: user } = useUser();
	const userRole = user?.role;
	const navigationData = useAppSelector(selectNavigationAll);

	const navigation = useMemo(() => {
		const _navigation = FuseNavigationHelper.unflattenNavigation(navigationData);

		function setAdditionalData(data: FuseNavItemType[]): FuseNavItemType[] {
			return data?.map((item) => ({
				hasPermission: Boolean(FuseUtils.hasPermission(item?.auth, userRole)),
				...item,
				// Ya no usamos traducción alguna, mantenemos el título original
				...(item?.children ? { children: setAdditionalData(item?.children) } : {})
			}));
		}

		const processedNavigation = setAdditionalData(_navigation);
		return processedNavigation;
	}, [navigationData, userRole]);

	const flattenNavigation = useMemo(() => {
		return FuseNavigationHelper.flattenNavigation(navigation);
	}, [navigation]);

	return { navigation, flattenNavigation };
}

export default useNavigation;
