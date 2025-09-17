export {
    loadingBouncyBall,
    loadingDoubleRing,
    loadingEclipse,
    loadingEllipsis,
    loadingFloatingSearch,
    loadingGears,
    loadingInfinity,
    loadingBouncyBall,
    loadingOrbital,
    loadingPacman,
    loadingRedBlueBall,
    loadingReloadArrow,
    loadingRing,
    loadingSpinner,
    loadingDoubleRing,
    loadingGears,
    loadingSpinner
} from '../dist/icons';



function testIcon(icon) {

    const svg = loadingBouncyBall({ colors: ['#0099e5', '#ff4c4c'], size: 100 });
    console.log(svg);
    expect(svg).toMatchSnapshot();
}

testIcon(loadingBouncyBall);

