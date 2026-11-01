function spawn3DBloodAndBones(x, y, count = 24, includeBones = false) {
    for (let i = 0; i < count; i++) {
        const isBone = includeBones && i % 4 === 0;
        const geo = isBone ? new THREE.BoxGeometry(0.18, 0.42, 0.18) : new THREE.BoxGeometry(0.22, 0.22, 0.22);
        const mat = new THREE.MeshStandardMaterial({
            color: isBone ? 0xfef3c7 : (Math.random() > 0.3 ? 0xdc2626 : 0x7f1d1d),
            roughness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, (Math.random() - 0.5) * 1.2);
        fxGroup.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * 8.5;
        particles3D.push({
            mesh,
            vx: Math.cos(angle) * spd,
            vy: Math.abs(Math.sin(angle)) * spd + 3.5,
            vz: (Math.random() - 0.5) * 4,
            life: 0.85 + Math.random() * 0.5
        });
    }
}

function spawn3DProjectile(owner, kind) {
    const dir = owner.facing;
    let geo, mat;
    if (kind === 'sonic') {
        geo = new THREE.TorusGeometry(0.65, 0.12, 8, 20);
        mat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });
    } else if (kind === 'venom') {
        geo = new THREE.SphereGeometry(0.48, 8, 8);
        mat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x16a34a,
            emissiveIntensity: 0.8
        });
    } else if (kind === 'feather') {
        geo = new THREE.ConeGeometry(0.25, 1.2, 4);
        mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    } else if (kind === 'dragon_fire') {
        geo = new THREE.SphereGeometry(0.68, 12, 12);
        mat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xf97316,
            emissiveIntensity: 1.2
        });
    } else {
        geo = new THREE.DodecahedronGeometry(0.55, 1);
        mat = new THREE.MeshStandardMaterial({
            color: owner.dino.accentColor,
            emissive: owner.dino.accentColor,
            emissiveIntensity: 0.65
        });
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(owner.x + dir * 2.1, 2.0, 0);
    if (kind === 'sonic') mesh.rotation.y = Math.PI / 2;
    fxGroup.add(mesh);

    projectiles3D.push({
        owner,
        mesh,
        kind,
        vx: dir * (kind === 'sonic' ? 19.5 : (kind === 'dragon_fire' ? 18.0 : 15.5)),
        damage: kind === 'xray_wave' ? 165 : (kind === 'dragon_fire' ? 120 : 85),
        life: 1.5
    });
}
