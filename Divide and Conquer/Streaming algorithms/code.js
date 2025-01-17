const { createCanvas } = require("canvas");
const fs = require("fs");

// تعريف كلاس Point لتمثيل النقاط
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// تعريف كلاس Rectangle لتمثيل المستطيلات
class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  // تحقق إذا كانت النقطة داخل المستطيل
  contains(point) {
    return (
      point.x >= this.x - this.w &&
      point.x <= this.x + this.w &&
      point.y >= this.y - this.h &&
      point.y <= this.y + this.h
    );
  }

  // تحقق إذا كان هناك تقاطع بين مستطيلين
  intersects(range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

// تعريف كلاس QuadTree لتمثيل شجرة Quadtree
class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary; // الحدود الجغرافية للـ Quadtree
    this.capacity = capacity; // الحد الأقصى للنقاط في كل قسم
    this.points = []; // النقاط المخزنة في هذا القسم
    this.divided = false; // هل تم تقسيم هذا القسم؟
  }

  // تقسيم القسم الحالي إلى 4 أقسام فرعية
  subdivide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    // إنشاء الأقسام الفرعية الأربعة
    const nw = new Rectangle(x - w, y - h, w, h);
    this.northwest = new QuadTree(nw, this.capacity);

    const ne = new Rectangle(x + w, y - h, w, h);
    this.northeast = new QuadTree(ne, this.capacity);

    const sw = new Rectangle(x - w, y + h, w, h);
    this.southwest = new QuadTree(sw, this.capacity);

    const se = new Rectangle(x + w, y + h, w, h);
    this.southeast = new QuadTree(se, this.capacity);

    this.divided = true; // تم تقسيم القسم
  }

  // إدخال نقطة جديدة إلى الـ Quadtree
  insert(point) {
    // إذا كانت النقطة خارج الحدود، لا يتم إدخالها
    if (!this.boundary.contains(point)) {
      return false;
    }

    // إذا كان القسم لم يصل إلى السعة القصوى، يتم إضافة النقطة
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    // إذا لم يتم تقسيم القسم بعد، يتم تقسيمه
    if (!this.divided) {
      this.subdivide();
    }

    // محاولة إدخال النقطة في الأقسام الفرعية
    if (this.northwest.insert(point)) return true;
    if (this.northeast.insert(point)) return true;
    if (this.southwest.insert(point)) return true;
    if (this.southeast.insert(point)) return true;

    return false;
  }

  // استعلام النقاط داخل نطاق معين
  query(range, found = []) {
    // إذا لم يكن هناك تقاطع بين النطاق والحدود، لا داعي للبحث
    if (!this.boundary.intersects(range)) {
      return found;
    }

    // إضافة النقاط الموجودة في هذا القسم والتي تقع داخل النطاق
    for (let p of this.points) {
      if (range.contains(p)) {
        found.push(p);
      }
    }

    // إذا تم تقسيم القسم، يتم البحث في الأقسام الفرعية
    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }

  // رسم الـ Quadtree على Canvas
  show(context) {
    // رسم حدود القسم الحالي
    context.strokeStyle = "#000";
    context.strokeRect(
      this.boundary.x - this.boundary.w,
      this.boundary.y - this.boundary.h,
      this.boundary.w * 2,
      this.boundary.h * 2
    );

    // إذا تم تقسيم القسم، يتم رسم الأقسام الفرعية
    if (this.divided) {
      this.northwest.show(context);
      this.northeast.show(context);
      this.southwest.show(context);
      this.southeast.show(context);
    }
  }
}

// إنشاء Canvas ورسم الـ Quadtree
const width = 800;
const height = 800;
const canvas = createCanvas(width, height);
const context = canvas.getContext("2d");

// تعريف الحدود الرئيسية للـ Quadtree
const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
const qtree = new QuadTree(boundary, 4);

// إضافة 100 نقطة عشوائية إلى الـ Quadtree
for (let i = 0; i < 100; i++) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  qtree.insert(new Point(x, y));
}

// تعيين خلفية بيضاء ورسم الـ Quadtree
context.fillStyle = "#fff";
context.fillRect(0, 0, width, height);
qtree.show(context);

// حفظ الصورة كملف PNG
const out = fs.createWriteStream(__dirname + "/quadtree.png");
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on("finish", () => console.log("تم إنشاء ملف quadtree.png بنجاح!"));
