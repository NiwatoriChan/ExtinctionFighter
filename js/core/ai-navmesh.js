/* ============================================================================
 * js/core/ai-navmesh.js — 3D NavMesh Generation, Pathfinding & Tactical Spatial Queries
 * Pairs ThreePathfinding (A* Polygon NavMesh), YUKA.NavMesh, and Kompute Tactical
 * Analyzer to generate safe paths, slope-aware waypoints, and sweet-spot positions.
 * ============================================================================ */

const ArenaNavSystem = {
    pathfinder: null,
    yukaNavMesh: null,
    tacticalAnalyzer: null,
    crowdSimulator: null,
    activeZoneId: null,
    lastPathWaypoints: [],
    lastSweetSpot: null,

    init() {
        if (!this.pathfinder && typeof ThreePathfinding !== 'undefined') {
            this.pathfinder = new ThreePathfinding.Pathfinding();
            this.crowdSimulator = new ThreePathfinding.CrowdSimulator();
        }
        if (!this.yukaNavMesh && typeof YUKA !== 'undefined') {
            this.yukaNavMesh = new YUKA.NavMesh();
        }
        if (!this.tacticalAnalyzer && typeof Kompute !== 'undefined') {
            this.tacticalAnalyzer = new Kompute.TacticalAnalyzer({
                stageLeft: typeof STAGE_LEFT_3D !== 'undefined' ? STAGE_LEFT_3D : -11.0,
                stageRight: typeof STAGE_RIGHT_3D !== 'undefined' ? STAGE_RIGHT_3D : 11.0,
                cornerThreshold: 2.35
            });
        }
    },

    /**
     * Generates a 3D NavMesh zone directly from the sculpted Three.js stage BufferGeometry
     * and registers terrain elevation nodes in both ThreePathfinding and YUKA.NavMesh.
     */
    buildArenaNavMesh(arenaType, stageGeometry = null) {
        this.init();
        const zoneId = arenaType || (typeof currentArena !== 'undefined' ? currentArena : 'volcano');
        this.activeZoneId = zoneId;

        const heightFn = (x, z = 0) => (
            typeof getArenaGroundHeight === 'function'
                ? getArenaGroundHeight(zoneId, x, z)
                : 0
        );

        if (this.pathfinder && typeof ThreePathfinding !== 'undefined') {
            const zoneData = ThreePathfinding.Pathfinding.createZone(stageGeometry, 1e-3, heightFn);
            this.pathfinder.setZoneData(zoneId, zoneData);
        }

        if (this.yukaNavMesh) {
            this.yukaNavMesh.fromTerrainFunction(-14.0, 14.0, 0.5, heightFn);
        }

        if (this.crowdSimulator) {
            this.crowdSimulator.clear();
        }
    },

    /**
     * Step 1 of the AI Loop: Computes a safe path and tactical sweet-spot
     * across the sculpted 3D arena terrain.
     */
    computeTacticalNavigation(aiFighter, targetFighter, projectiles = []) {
        this.init();
        const zoneId = this.activeZoneId || (typeof currentArena !== 'undefined' ? currentArena : 'volcano');
        if (!this.pathfinder || !this.pathfinder.zones[zoneId]) {
            this.buildArenaNavMesh(zoneId, null);
        }

        const heightFn = (x, z = 0) => (
            typeof getArenaGroundHeight === 'function'
                ? getArenaGroundHeight(zoneId, x, z)
                : 0
        );

        const sweetSpot = this.tacticalAnalyzer
            ? this.tacticalAnalyzer.computeSweetSpotPosition(aiFighter, targetFighter, heightFn)
            : {
                x: targetFighter.x + (aiFighter.x >= targetFighter.x ? 3.1 : -3.1),
                y: aiFighter.groundY || 0,
                z: 0,
                desiredSpacing: 3.1,
                myReach: 3.45,
                enemyReach: 3.45,
                isCornered: false,
                wantsDefensiveCover: false
            };

        const projectileThreat = this.tacticalAnalyzer
            ? this.tacticalAnalyzer.evaluateProjectileThreat(aiFighter.x, aiFighter.y || 0, projectiles, aiFighter)
            : null;

        const unblockableThreat = this.tacticalAnalyzer
            ? this.tacticalAnalyzer.evaluateSeismicOrUnblockableThreat(aiFighter, targetFighter)
            : null;

        const startPos = new THREE.Vector3(aiFighter.x, aiFighter.y || 0, 0);
        const destPos = new THREE.Vector3(sweetSpot.x, sweetSpot.y || 0, 0);

        let waypoints = null;
        if (this.pathfinder) {
            const groupId = this.pathfinder.getGroup(zoneId, startPos) || 0;
            waypoints = this.pathfinder.findPath(startPos, destPos, zoneId, groupId);
        }
        if ((!waypoints || waypoints.length === 0) && this.yukaNavMesh) {
            waypoints = this.yukaNavMesh.findPath(startPos, destPos);
        }
        if (!waypoints || waypoints.length === 0) {
            waypoints = [destPos];
        }

        this.lastPathWaypoints = waypoints;
        this.lastSweetSpot = sweetSpot;

        const nextWaypoint = waypoints.length > 1 ? waypoints[1] : waypoints[0];
        const currentSlope = typeof getFighterSurfaceSlope === 'function'
            ? getFighterSurfaceSlope(aiFighter, zoneId)
            : 0;
        const heightAdvantage = (aiFighter.y || 0) - (targetFighter.y || 0);

        return {
            zoneId,
            sweetSpot,
            waypoints,
            nextWaypoint,
            projectileThreat,
            unblockableThreat,
            currentSlope,
            heightAdvantage,
            hasLineOfSight: this.tacticalAnalyzer
                ? this.tacticalAnalyzer.hasLineOfSight(startPos, new THREE.Vector3(targetFighter.x, targetFighter.y || 0, 0), heightFn)
                : true
        };
    }
};
