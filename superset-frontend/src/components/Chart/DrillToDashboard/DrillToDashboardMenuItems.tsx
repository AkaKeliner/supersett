import React, {ReactNode, useMemo} from 'react';
import {BinaryQueryObjectFilterClause, css, DDChart, QueryFormData, t,} from '@superset-ui/core';
import {Menu} from 'src/components/Menu';
// import {useDispatch} from 'react-redux';
import {MenuItemTooltip} from '../DisabledMenuItemTooltip';
// import {DashboardPageIdContext} from '../../../dashboard/containers/DashboardPage';
// import {drilldownToChart} from '../chartAction';
import {MenuItemWithTruncation} from '../MenuItemWithTruncation';
import {getSubmenuYOffset} from '../utils';
import shortid from "shortid";

const DisabledMenuItem = ({children, ...props}: { children: ReactNode }) => (
    <Menu.Item disabled {...props}>
        <div
            css={css`
              white-space: normal;
              max-width: 160px;
            `}
        >
            {children}
        </div>
    </Menu.Item>
);
export type DrillDetailMenuItemsProps = {
    drillToChart?: Array<DDChart>;
    drillToDashboards?: Array<DDChart>;
    formData: QueryFormData;
    filters?: BinaryQueryObjectFilterClause[];
    isContextMenu?: boolean;
    contextMenuY?: number;
    onSelection?: () => void;
    onClick?: (event: MouseEvent) => void;
    submenuIndex?: number;
};
export type UnknownObject = Record<string, any>;
const queryString = (search: string): UnknownObject => {
    return search.slice(search.indexOf('?') + 1).split('&').reduce((params, hash) => {
        let [key, val] = hash.split('=')
        return Object.assign(params, {[key]: decodeURIComponent(val)})
    }, {})
};

const DrillToDashboardMenuItems = ({
                                       formData,
                                       drillToDashboards,
                                       filters = [],
                                       isContextMenu = false,
                                       contextMenuY = 0,
                                       onSelection = () => null,
                                       onClick = () => null,
                                       submenuIndex = 0,
                                       ...props
                                   }: DrillDetailMenuItemsProps) => {
    //TODO понадобится
    // const dispatch = useDispatch();
    // const dashboardPageId = useContext(DashboardPageIdContext);
    // const exploreUrl = useMemo(
    //   () => `/explore/?dashboard_page_id=${dashboardPageId}&slice_id=${chartId}`,
    //   [chartId, dashboardPageId],
    // );

    // const state = useSelector(state => state);
    const goToDashboard = (filter: DDChart) => {
        // const { actions, formData } = this.slice.props;
        const sliceId = formData.slice_id;
        const url = queryString(location.search);
        const hid = url.hid || shortid.generate();
        const hidIndex = Number.parseInt(url.hid_index) || 0;
        debugger
        console.log('filter', filter);


        try {
            // const newFormData = await fetchSliceFormData(sliceId, formData, filters);
            const newFormData = formData;
            // actions.saveDashboardState(hid, hidIndex);
            const newFilters = newFormData?.extra_filters || [];
            const preselect_filters_key = shortid.generate();
            const preselect_filters = {[sliceId]: [...newFilters]};
            sessionStorage.setItem(preselect_filters_key, JSON.stringify(preselect_filters));
            const dataKey = shortid.generate();
            const data = {extra_where: newFormData.where, filters: newFilters};
            sessionStorage.setItem(dataKey, JSON.stringify(data));
            window.location.href = `/superset/dashboard/${filter.url}/?preselect_filters_key=${preselect_filters_key}&hid=${hid}&hid_index=${hidIndex +
            1}&data_key=${dataKey}`;
        } catch (err) {
            console.log(err);
        }
    }

    //   try {
    //     // const dashboardId = filter.url;
    //     //ToDO Тестовый фильтр для инфопанели
    //
    //     // @ts-ignore
    //     const testFilter = {
    //       id: "NATIVE_FILTER-7p4ZcGPbt",
    //       controlValues: {
    //         enableEmptyFilter: false,
    //         defaultToFirstItem: false,
    //         multiSelect: true,
    //         searchAllOptions: false,
    //         inverseSelection: false
    //       },
    //       name: "ФИЛЬТР 1",
    //       filterType: "filter_select",
    //       targets: [
    //         {
    //           datasetId: 10,
    //           column: {
    //             name: filter.field
    //           }
    //         }
    //       ],
    //       defaultDataMask: {
    //         extraFormData: {},
    //         filterState: {
    //           validateMessage: false,
    //           validateStatus: false,
    //           label: typeof filter.value === 'string' ? filter.value : (filter || {}).value[0],
    //           value: typeof filter.value === 'string' ? [filter.value] : filter.value,
    //         },
    //         ownState: {}
    //       },
    //       cascadeParentIds: [],
    //       scope: {
    //         rootPath: [
    //           "ROOT_ID"
    //         ],
    //         excluded: []
    //       },
    //       type: "NATIVE_FILTER",
    //       description: ""
    //     }
    //     const dashboardId = filter.url;
    //     const newFormData = formData;
    //     const sliceId = formData.sliceId;
    //     const newFilters = newFormData?.extra_filters || [];
    //     const preselect_filters_key = shortid.generate();
    //     const preselect_filters = {[sliceId]: [...newFilters]};
    //     sessionStorage.setItem(preselect_filters_key, JSON.stringify(preselect_filters));
    //     const dataKey = shortid.generate();
    //     const data = {extra_where: newFormData.where, filters: newFilters};
    //     sessionStorage.setItem(dataKey, JSON.stringify(data));
    //     window.location.href = `/superset/dashboard/${dashboardId}/?native_filters_key=xIhfEZKfACZZ8cRqlSV44Eb4A_KluE3Yeivdh6R-T5vL0SLwxUbfO6hwG4tE7AKl`;
    //   } catch (err) {
    //     console.log("ERROR!!!!!!!!!!!!", err)
    //   }
    // };

    const submenuYOffset = useMemo(
        () =>
            getSubmenuYOffset(
                contextMenuY,
                filters.length > 1 ? filters.length + 1 : filters.length,
                submenuIndex,
            ),
        [contextMenuY, filters.length, submenuIndex],
    );
    let drillToDashboardMenuItem;
    if (!drillToDashboards?.length) {
        drillToDashboardMenuItem = (
            <DisabledMenuItem {...props} key="drill-detail-no-aggregations">
                {t('Drill to dashboard by')}
                <MenuItemTooltip title={t('Нет DD')}/>
            </DisabledMenuItem>
        );
    } else {
        drillToDashboardMenuItem = (
            <Menu.SubMenu
                {...props}
                popupOffset={[0, submenuYOffset]}
                popupClassName="chart-context-submenu"
                title={t('Drill to dashboard by')}
            >
                {t('Drill to dashboard by')}
                <div data-test="drill-to-detail-by-submenu">
                    {drillToDashboards.map((filter, i) => (
                        <MenuItemWithTruncation
                            {...props}
                            key={`drill-detail-filter-${i}`}
                            tooltipText={`${filter.title}`}
                            onClick={() => goToDashboard(filter)}
                        >
                            {`${filter.title} `}
                        </MenuItemWithTruncation>
                    ))}
                </div>
            </Menu.SubMenu>
        );
    }
    return <>{drillToDashboardMenuItem}</>;
};

export default DrillToDashboardMenuItems;
