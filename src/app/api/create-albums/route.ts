// import Albums from '@/backend/db/models/albums';
// import { NextResponse } from 'next/server';


// export async function POST(request: Request) {
//   const body = await request.json();
//   console.log("🚀 ~ POST ~ body:", body)

//   try {

//     const album = await Albums.create({
//       name: body.name,
//       size: body.size,
//       coverImage: body.coverImage,
//     });
    
//     console.log("🚀 ~ POST ~ album:", album)

//     return NextResponse.json(album);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to create create album' },
//       { status: 500 }
//     );
//   }
// }

