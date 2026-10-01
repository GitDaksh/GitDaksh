// Straight 3D contribution calendar for github-profile-3d-contrib v0.9.3.
// Based on src/create-3d-contrib.ts by yoshi389111 (MIT License).
// Replaces the diagonal isometric view with a level band: weeks run left to
// right and the seven weekdays recede into depth (Sunday at the back). Blocks
// keep the original faces, colours, height scale and growing animation.
import * as d3 from 'd3';
import * as util from './utils';
import * as type from './type';

const DEPTH_ANGLE = 54; // degrees: direction the weekday rows recede (up and to the right)
const DEPTH_RATIO = 0.95; // depth of one weekday row, relative to one week column

const toEpochDays = (date: Date): number =>
    Math.floor(date.getTime() / (24 * 60 * 60 * 1000));

// kept for create-svg.ts; the straight layout needs no shared definitions
export const addDefines = (
    _svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    _settings: type.Settings,
): void => {
    return;
};

export const create3DContrib = (
    svg: d3.Selection<SVGSVGElement, unknown, null, unknown>,
    userInfo: type.UserInfo,
    x: number,
    y: number,
    width: number,
    height: number,
    settings: type.FullSettings,
    isForcedAnimation = false,
): void => {
    if (userInfo.contributionCalendar.length === 0) {
        return;
    }

    const firstDate = userInfo.contributionCalendar[0].date;
    const sundayOfFirstWeek = toEpochDays(firstDate) - firstDate.getUTCDay();
    const weekcount = Math.ceil(
        (userInfo.contributionCalendar.length + firstDate.getUTCDay()) / 7.0,
    );

    const dx = width / 64; // one week column
    const depth = dx * DEPTH_RATIO; // one weekday row
    const rad = (DEPTH_ANGLE * Math.PI) / 180;
    const ddx = depth * Math.cos(rad);
    const ddy = depth * Math.sin(rad);
    const face = dx * 0.9; // block width
    const ex = ddx * 0.9; // block depth (screen x)
    const ey = ddy * 0.9; // block depth (screen y)
    const skewTop = util.toFixed((-Math.atan2(ex, ey) * 180) / Math.PI);
    const skewSide = util.toFixed((-Math.atan2(ey, ex) * 180) / Math.PI);

    const bandWidth = weekcount * dx + 6 * ddx + ex;
    const offsetX = x + (width - bandWidth) / 2;
    const offsetY = y + height; // ground line of the front (Saturday) row

    const isAnimate = settings.growingAnimation || isForcedAnimation;
    const group = svg.append('g');

    // painter's order: back rows first, then left to right
    const cells = [...userInfo.contributionCalendar].sort(
        (a, b) =>
            a.date.getUTCDay() - b.date.getUTCDay() ||
            a.date.getTime() - b.date.getTime(),
    );

    cells.forEach((cal) => {
        const week = Math.floor(
            (toEpochDays(cal.date) - sundayOfFirstWeek) / 7,
        );
        const row = 6 - cal.date.getUTCDay(); // sun = 6 (back) ... sat = 0 (front)

        const baseX = offsetX + week * dx + row * ddx;
        const baseY = offsetY - row * ddy;
        // same height scale as the original
        const calHeight = Math.log10(cal.contributionCount / 20 + 1) * 144 + 3;
        const contribLevel = cal.contributionLevel;

        const bar = group
            .append('g')
            .attr(
                'transform',
                `translate(${util.toFixed(baseX)} ${util.toFixed(
                    baseY - calHeight,
                )})`,
            );
        if (isAnimate && contribLevel !== 0) {
            bar.append('animateTransform')
                .attr('attributeName', 'transform')
                .attr('type', 'translate')
                .attr(
                    'values',
                    `${util.toFixed(baseX)} ${util.toFixed(
                        baseY - 3,
                    )};${util.toFixed(baseX)} ${util.toFixed(
                        baseY - calHeight,
                    )}`,
                )
                .attr('dur', '3s')
                .attr('repeatCount', '1');
        }

        // top face
        bar.append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', util.toFixed(-ey))
            .attr('width', util.toFixed(face))
            .attr('height', util.toFixed(ey))
            .attr('transform', `skewX(${skewTop})`)
            .attr('class', `cont-top-${contribLevel}`);

        // front face
        const frontPanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(face))
            .attr('height', util.toFixed(calHeight))
            .attr('class', `cont-left-${contribLevel}`);

        // side face
        const sidePanel = bar
            .append('rect')
            .attr('stroke', 'none')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', util.toFixed(ex))
            .attr('height', util.toFixed(calHeight))
            .attr(
                'transform',
                `translate(${util.toFixed(face)} 0) skewY(${skewSide})`,
            )
            .attr('class', `cont-right-${contribLevel}`);

        if (isAnimate && contribLevel !== 0) {
            for (const panel of [frontPanel, sidePanel]) {
                panel
                    .append('animate')
                    .attr('attributeName', 'height')
                    .attr('values', `3;${util.toFixed(calHeight)}`)
                    .attr('dur', '3s')
                    .attr('repeatCount', '1');
            }
        }
    });
};
